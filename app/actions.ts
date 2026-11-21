"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type Participant = {
  id: string;
  name: string;
  phoneNumber: string;
  serialNumber: number;
  selectedNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AvailableNumbers = {
  serialNumbers: number[];
  nextSerialNumber: number;
};

/**
 * Get all participants
 */
export async function getParticipants(): Promise<Participant[]> {
  const participants = await prisma.participant.findMany({
    orderBy: { serialNumber: "asc" },
  });
  return participants;
}

/**
 * Get available numbers for selection
 */
export async function getAvailableNumbers(): Promise<AvailableNumbers> {
  const participants = await prisma.participant.findMany({
    select: { serialNumber: true, selectedNumber: true },
  });

  // Get all serial numbers and selected numbers
  const takenSerialNumbers = new Set(participants.map((p) => p.serialNumber));
  const takenSelectedNumbers = new Set(
    participants
      .map((p) => p.selectedNumber)
      .filter((n): n is number => n !== null),
  );

  // Next serial number is the count + 1
  const nextSerialNumber = participants.length + 1;

  // Available numbers are serial numbers that haven't been selected yet
  const availableNumbers = Array.from(takenSerialNumbers).filter(
    (num) => !takenSelectedNumbers.has(num),
  );

  return {
    serialNumbers: availableNumbers.sort((a, b) => a - b),
    nextSerialNumber,
  };
}

/**
 * Create a new participant
 */
export async function createParticipant(data: {
  name: string;
  phoneNumber: string;
  selectedNumber?: number;
}): Promise<{ success: boolean; error?: string; participant?: Participant }> {
  try {
    // Validate inputs
    if (!data.name.trim()) {
      return { success: false, error: "Name is required" };
    }

    if (!data.phoneNumber.trim()) {
      return { success: false, error: "Phone number is required" };
    }

    // Get the next serial number and current count
    const count = await prisma.participant.count();
    const serialNumber = count + 1;
    const isFirstParticipant = count === 0;

    // First participant can sign up without selecting anyone
    if (isFirstParticipant) {
      const participant = await prisma.participant.create({
        data: {
          name: data.name.trim(),
          phoneNumber: data.phoneNumber.trim(),
          serialNumber,
          selectedNumber: null, // First user doesn't select anyone yet
        },
      });

      revalidatePath("/");
      return { success: true, participant };
    }

    // For second participant and beyond, selection is required
    if (!data.selectedNumber) {
      return { success: false, error: "Please select a number" };
    }

    // Check if the selected number is already taken
    const existingSelection = await prisma.participant.findFirst({
      where: { selectedNumber: data.selectedNumber },
    });

    if (existingSelection) {
      return { success: false, error: "This number has already been selected" };
    }

    // Check if the selected number is valid (must be an existing serial number)
    const validNumber = await prisma.participant.findUnique({
      where: { serialNumber: data.selectedNumber },
    });

    if (!validNumber) {
      return { success: false, error: "Invalid number selection" };
    }

    // Create the participant
    const participant = await prisma.participant.create({
      data: {
        name: data.name.trim(),
        phoneNumber: data.phoneNumber.trim(),
        serialNumber,
        selectedNumber: data.selectedNumber,
      },
    });

    // Special handling: If this is the second participant, auto-assign first participant to select this one
    if (count === 1) {
      const firstParticipant = await prisma.participant.findUnique({
        where: { serialNumber: 1 },
      });

      if (firstParticipant && firstParticipant.selectedNumber === null) {
        await prisma.participant.update({
          where: { id: firstParticipant.id },
          data: { selectedNumber: serialNumber }, // First person selects second person's number
        });
      }
    }

    revalidatePath("/");
    return { success: true, participant };
  } catch (error) {
    console.error("Error creating participant:", error);
    return { success: false, error: "Failed to create participant" };
  }
}

/**
 * Get participant by ID
 */
export async function getParticipantById(
  id: string,
): Promise<Participant | null> {
  return await prisma.participant.findUnique({
    where: { id },
  });
}

/**
 * Check if a number is available for selection
 */
export async function isNumberAvailable(number: number): Promise<boolean> {
  const participant = await prisma.participant.findUnique({
    where: { selectedNumber: number },
  });
  return !participant;
}
