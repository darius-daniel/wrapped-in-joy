"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";

export type AvailableNumber = {
  serialNumber: number;
  name: string;
};

/**
 * Check a participant's assignment by phone number
 */
export async function checkAssignment(phoneNumber: string): Promise<
  | {
      success: true;
      participant: {
        name: string;
        serialNumber: number;
        phoneNumber: string;
        location?: string;
      };
      assignedTo: {
        name: string;
        serialNumber: number;
        phoneNumber: string;
        location?: string;
      } | null;
      message?: string;
    }
  | { success: false; error: string }
> {
  try {
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedPhone) {
      return { success: false, error: "Phone number is required" };
    }

    // Find participant by phone number
    const allParticipants = await db.orm.public.Participant.all();
    const participant = allParticipants.find(
      (p) => p.phoneNumber === trimmedPhone
    );

    if (!participant) {
      return {
        success: false,
        error: "No registration found with this phone number",
      };
    }

    // If they haven't been assigned yet (first participant before second signs up)
    if (participant.selectedNumber === null) {
      return {
        success: true,
        participant: {
          name: participant.name,
          serialNumber: participant.serialNumber,
          phoneNumber: participant.phoneNumber,
          location: participant.location || undefined,
        },
        assignedTo: null,
        message: "You'll be notified once you're assigned to someone!",
      };
    }

    // Find who they're assigned to
    const assignedTo = allParticipants.find(
      (p) => p.serialNumber === participant.selectedNumber
    );

    if (!assignedTo) {
      return {
        success: false,
        error: "Assignment data incomplete. Please contact the organizer.",
      };
    }

    return {
      success: true,
      participant: {
        name: participant.name,
        serialNumber: participant.serialNumber,
        phoneNumber: participant.phoneNumber,
        location: participant.location || undefined,
      },
      assignedTo: {
        name: assignedTo.name,
        serialNumber: assignedTo.serialNumber,
        phoneNumber: assignedTo.phoneNumber,
        location: assignedTo.location || undefined,
      },
    };
  } catch (error) {
    console.error("Check assignment error:", error);
    return {
      success: false,
      error: "An error occurred. Please try again.",
    };
  }
}

/**
 * Get all available numbers (1-100) that haven't been selected yet
 */
export async function getAvailableNumbers(): Promise<AvailableNumber[]> {
  // Get all participants
  const allParticipants = await db.orm.public.Participant.all();

  // Get all selected numbers (numbers that have been claimed)
  const selectedNumbers = new Set(
    allParticipants
      .map((p) => p.selectedNumber)
      .filter((n): n is number => n !== null)
  );

  // Create array of numbers 1-100 that haven't been selected
  const availableNumbers: AvailableNumber[] = [];

  for (let i = 1; i <= 100; i++) {
    if (!selectedNumbers.has(i)) {
      // Check if this serial number has a participant registered
      const participant = allParticipants.find((p) => p.serialNumber === i);

      availableNumbers.push({
        serialNumber: i,
        name: participant ? participant.name : `Number ${i} (not yet registered)`,
      });
    }
  }

  return availableNumbers.sort((a, b) => a.serialNumber - b.serialNumber);
}

/**
 * Admin function: Run the lottery draw to randomly assign participants
 * Call this after the signup deadline
 */
export async function runLotteryDraw() {
  try {
    const allParticipants = await db.orm.public.Participant.all();

    if (allParticipants.length < 2) {
      return {
        success: false,
        error: "Need at least 2 participants to run the lottery",
      };
    }

    // Get participants without assignments
    const unassigned = allParticipants.filter(p => p.selectedNumber === null);

    if (unassigned.length === 0) {
      return {
        success: true,
        message: "All participants already have assignments",
        count: 0,
      };
    }

    // Create a pool of all serial numbers
    const allSerialNumbers = allParticipants.map(p => p.serialNumber);

    // Fisher-Yates shuffle for random assignment
    const shuffled = [...allSerialNumbers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign each participant to the next one in the shuffled array
    // This creates a single loop where everyone gifts to someone
    const assignments = [];
    for (let i = 0; i < allParticipants.length; i++) {
      const participant = allParticipants[i];
      const assignedTo = shuffled[(i + 1) % shuffled.length]; // Next in loop

      // Make sure no one is assigned to themselves
      if (assignedTo === participant.serialNumber) {
        // Swap with next
        const nextIndex = (i + 2) % shuffled.length;
        [shuffled[(i + 1) % shuffled.length], shuffled[nextIndex]] =
          [shuffled[nextIndex], shuffled[(i + 1) % shuffled.length]];
      }

      const finalAssignment = shuffled[(i + 1) % shuffled.length];

      await db.orm.public.Participant.where({
        id: participant.id,
      }).update({
        selectedNumber: finalAssignment,
        updatedAt: new Date(),
      });

      const assignedPerson = allParticipants.find(p => p.serialNumber === finalAssignment);
      assignments.push({
        participant: participant.name,
        serialNumber: participant.serialNumber,
        assignedTo: assignedPerson?.name || `#${finalAssignment}`,
        assignedNumber: finalAssignment,
      });
    }

    revalidatePath("/signup");
    revalidatePath("/check-assignment");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Lottery draw completed successfully!",
      count: assignments.length,
      assignments,
    };
  } catch (error) {
    console.error("Lottery draw error:", error);
    return {
      success: false,
      error: "An error occurred during the lottery draw",
    };
  }
}

/**
 * Get the total count of participants
 */
export async function getParticipantCount(): Promise<number> {
  const allParticipants = await db.orm.public.Participant.all();
  return allParticipants.length;
}

type SignupResult =
  | {
      success: true;
      serialNumber: number;
      selectedParticipant?: {
        name: string;
        phoneNumber: string;
        serialNumber: number;
      };
    }
  | { success: false; error: string };

/**
 * Sign up a new participant
 * In lottery mode, selectedNumber is always null - assignments happen after deadline
 */
export async function signupParticipant(
  name: string,
  phoneNumber: string,
  location: string,
  selectedNumber: number | null
): Promise<SignupResult> {
  try {
    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "Name is required" };
    }
    if (trimmedName.length < 2) {
      return { success: false, error: "Name must be at least 2 characters long" };
    }
    if (trimmedName.length > 100) {
      return { success: false, error: "Name is too long (max 100 characters)" };
    }
    // Check for valid name characters (letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedName)) {
      return { success: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
    }

    // Validate location
    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      return { success: false, error: "Location is required" };
    }
    if (trimmedLocation.length < 2) {
      return { success: false, error: "Location must be at least 2 characters long" };
    }
    if (trimmedLocation.length > 100) {
      return { success: false, error: "Location is too long (max 100 characters)" };
    }

    // Validate phone number
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      return { success: false, error: "Phone number is required" };
    }

    // Ensure it starts with +234
    if (!trimmedPhone.startsWith('+234')) {
      return {
        success: false,
        error: "Phone number must start with +234"
      };
    }

    // Remove +234 prefix and any formatting characters for validation
    const cleanedPhone = trimmedPhone.substring(4).replace(/[\s\-\(\)\.]/g, '');

    // Check if it contains exactly 10 digits after +234
    if (!/^[0-9]{10}$/.test(cleanedPhone)) {
      return {
        success: false,
        error: "Please enter a valid 10-digit Nigerian phone number"
      };
    }

    // Check for duplicate phone number
    const allParticipants = await db.orm.public.Participant.all();
    const existingParticipant = allParticipants.find(
      (p) => p.phoneNumber === trimmedPhone
    );

    if (existingParticipant) {
      return {
        success: false,
        error: "This phone number is already registered",
      };
    }

    // Get current participant count to determine serial number
    const count = await getParticipantCount();
    const newSerialNumber = count + 1;

    // Create the participant with no assignment (lottery assigns later)
    await db.orm.public.Participant.create({
      id: crypto.randomUUID(),
      name: trimmedName,
      phoneNumber: trimmedPhone,
      ...(trimmedLocation && { location: trimmedLocation }),
      serialNumber: newSerialNumber,
      selectedNumber: null, // Always null in lottery mode
      updatedAt: new Date(),
    });

    revalidatePath("/signup");
    return {
      success: true,
      serialNumber: newSerialNumber,
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "An error occurred during signup. Please try again.",
    };
  }
}