"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";

export type AvailableNumber = {
  serialNumber: number;
  name: string;
};

/**
 * Get all available numbers that can be selected
 * A number is available if:
 * 1. Someone has already signed up with that serial number
 * 2. No one has selected that number yet
 */
export async function getAvailableNumbers(): Promise<AvailableNumber[]> {
  // Get all participants
  const allParticipants = await db.orm.public.Participant.all();

  // Get all selected numbers
  const selectedNumbers = new Set(
    allParticipants
      .map((p) => p.selectedNumber)
      .filter((n): n is number => n !== null)
  );

  // Return participants whose numbers haven't been selected yet, sorted by serial number
  return allParticipants
    .filter((p) => !selectedNumbers.has(p.serialNumber))
    .sort((a, b) => a.serialNumber - b.serialNumber)
    .map((p) => ({
      serialNumber: p.serialNumber,
      name: p.name,
    }));
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
    // Remove common formatting characters for validation
    const cleanedPhone = trimmedPhone.replace(/[\s\-\(\)\.]/g, '');
    // Check if it contains only digits and optional + at the start
    if (!/^\+?[0-9]{10,15}$/.test(cleanedPhone)) {
      return {
        success: false,
        error: "Please enter a valid phone number (10-15 digits, optional + prefix)"
      };
    }

    // Get current participant count to determine serial number
    const count = await getParticipantCount();
    const newSerialNumber = count + 1;

    // If this is not the first participant, validate selected number
    if (count > 0 && selectedNumber === null) {
      return {
        success: false,
        error: "Please select a number to gift to",
      };
    }

    // If a number was selected, verify it's available and get the participant details
    let selectedParticipant = undefined;
    if (selectedNumber !== null) {
      const availableNumbers = await getAvailableNumbers();
      const selectedAvailable = availableNumbers.find(
        (n) => n.serialNumber === selectedNumber
      );

      if (!selectedAvailable) {
        return {
          success: false,
          error: "The selected number is no longer available",
        };
      }

      // Get the full participant details for the selected number
      const allParticipants = await db.orm.public.Participant.all();
      const selectedParticipantData = allParticipants.find(
        (p) => p.serialNumber === selectedNumber
      );

      if (selectedParticipantData) {
        selectedParticipant = {
          name: selectedParticipantData.name,
          phoneNumber: selectedParticipantData.phoneNumber,
          serialNumber: selectedParticipantData.serialNumber,
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

    // If this is the second participant and the first participant hasn't selected anyone,
    // assign the second participant to the first
    if (count === 1) {
      const firstParticipant = await db.orm.public.Participant.where({
        serialNumber: 1,
      }).first();

      if (firstParticipant && firstParticipant.selectedNumber === null) {
        await db.orm.public.Participant.where({
          id: firstParticipant.id,
        }).update({
          selectedNumber: newSerialNumber,
          updatedAt: new Date(),
        });
      }
    }

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