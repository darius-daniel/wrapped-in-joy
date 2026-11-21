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
      };
      assignedTo: {
        name: string;
        serialNumber: number;
        phoneNumber: string;
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
      },
      assignedTo: {
        name: assignedTo.name,
        serialNumber: assignedTo.serialNumber,
        phoneNumber: assignedTo.phoneNumber,
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
 * Admin function: Reassign participants who selected unregistered numbers
 * Call this after registration closes
 */
export async function reassignUnregisteredNumbers() {
  try {
    const allParticipants = await db.orm.public.Participant.all();

    // Get all registered serial numbers
    const registeredNumbers = new Set(
      allParticipants.map((p) => p.serialNumber)
    );

    // Find participants who selected numbers that were never registered
    const needReassignment = allParticipants.filter(
      (p) => p.selectedNumber !== null && !registeredNumbers.has(p.selectedNumber)
    );

    if (needReassignment.length === 0) {
      return {
        success: true,
        message: "No reassignments needed",
        count: 0,
      };
    }

    // Get available registered serial numbers (not yet selected)
    const selectedNumbers = new Set(
      allParticipants
        .map((p) => p.selectedNumber)
        .filter((n): n is number => n !== null && registeredNumbers.has(n))
    );

    const availableRegistered = Array.from(registeredNumbers)
      .filter((n) => !selectedNumbers.has(n))
      .sort((a, b) => a - b);

    if (availableRegistered.length < needReassignment.length) {
      return {
        success: false,
        error: "Not enough available registered participants for reassignment",
        needReassignment: needReassignment.length,
        available: availableRegistered.length,
      };
    }

    // Perform reassignments
    const reassignments = [];
    for (let i = 0; i < needReassignment.length; i++) {
      const participant = needReassignment[i];
      const newAssignment = availableRegistered[i];

      await db.orm.public.Participant.where({
        id: participant.id,
      }).update({
        selectedNumber: newAssignment,
        updatedAt: new Date(),
      });

      reassignments.push({
        participant: participant.name,
        oldNumber: participant.selectedNumber,
        newNumber: newAssignment,
      });
    }

    revalidatePath("/signup");
    revalidatePath("/check-assignment");

    return {
      success: true,
      message: "Reassignments completed",
      count: reassignments.length,
      details: reassignments,
    };
  } catch (error) {
    console.error("Reassignment error:", error);
    return {
      success: false,
      error: "An error occurred during reassignment",
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
 */
export async function signupParticipant(
  name: string,
  phoneNumber: string,
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

    // Get current participant count to determine serial number
    const count = await getParticipantCount();
    const newSerialNumber = count + 1;

    // First participant can skip selection (will be assigned later)
    if (count === 0 && selectedNumber === null) {
      // This is allowed for first participant
    } else if (count > 0 && selectedNumber === null) {
      // For everyone else, selection is required
      return {
        success: false,
        error: "Please select a number to gift to",
      };
    }

    // If a number was selected, verify it's available (not already taken)
    let selectedParticipant = undefined;
    if (selectedNumber !== null) {
      // Check if the number is in valid range (1-100)
      if (selectedNumber < 1 || selectedNumber > 100) {
        return {
          success: false,
          error: "Please select a number between 1 and 100",
        };
      }

      // Check if this number has already been selected by someone else
      const allParticipants = await db.orm.public.Participant.all();
      const alreadySelected = allParticipants.find(
        (p) => p.selectedNumber === selectedNumber
      );

      if (alreadySelected) {
        // Number already taken - suggest available numbers
        const availableNumbers = await getAvailableNumbers();
        const suggestions = availableNumbers.slice(0, 5).map(n => n.serialNumber).join(", ");

        return {
          success: false,
          error: `Number ${selectedNumber} has already been selected. Try one of these: ${suggestions}`,
        };
      }

      // Get participant details if they exist for this serial number
      const selectedParticipantData = allParticipants.find(
        (p) => p.serialNumber === selectedNumber
      );

      if (selectedParticipantData) {
        selectedParticipant = {
          name: selectedParticipantData.name,
          phoneNumber: selectedParticipantData.phoneNumber,
          serialNumber: selectedParticipantData.serialNumber,
        };
      } else {
        // Number not yet assigned to anyone - they're claiming it for future
        selectedParticipant = {
          name: `Number ${selectedNumber} (not yet registered)`,
          phoneNumber: "To be determined",
          serialNumber: selectedNumber,
        };
      }
    }

    // Create the participant
    await db.orm.public.Participant.create({
      id: crypto.randomUUID(),
      name: trimmedName,
      phoneNumber: trimmedPhone,
      serialNumber: newSerialNumber,
      selectedNumber: selectedNumber,
      updatedAt: new Date(),
    });

    revalidatePath("/signup");
    return {
      success: true,
      serialNumber: newSerialNumber,
      selectedParticipant,
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "An error occurred during signup. Please try again.",
    };
  }
}