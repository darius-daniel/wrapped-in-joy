"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import {
  GRACE_ENDS,
  GRACE_HOURS,
  SIGNUP_DEADLINE,
  exchangePhaseAt,
  type ExchangePhase,
} from "@/lib/exchange";

const MIN_SERIAL = 1;
const MAX_SERIAL = 100;

export type NumberAvailability = {
  serialNumber: number;
  /** Already chosen as someone's gift target. */
  taken: boolean;
  /** Name of the participant who owns this serial, if anyone has registered it. */
  ownerName: string | null;
};

export type DrawAssignment = {
  participant: string;
  serialNumber: number;
  assignedTo: string;
  assignedNumber: number;
};

export type DrawResult =
  | {
      success: true;
      message: string;
      count: number;
      honored: number;
      repaired: number;
      assignments: DrawAssignment[];
    }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** A permutation of `serials` in which no element keeps its original position. */
function randomDerangement(serials: number[]): number[] {
  const n = serials.length;
  for (let attempt = 0; attempt < 100; attempt++) {
    const pool = shuffle(serials);
    if (pool.every((value, i) => value !== serials[i])) return pool;
  }
  // Rotating by one is always a derangement when n >= 2.
  return serials.map((_, i) => serials[(i + 1) % n]);
}

type Matchable = { id: string; serialNumber: number };

/**
 * Kuhn's augmenting-path algorithm. Returns a target serial for every entry in
 * `left`, or null when no perfect matching exists. A participant can never be
 * matched to their own serial.
 */
function matchTargets(
  left: Matchable[],
  targets: number[]
): Map<string, number> | null {
  const takenBy = new Array<number>(targets.length).fill(-1);
  const visited = new Array<boolean>(targets.length).fill(false);

  const augment = (li: number): boolean => {
    for (let ti = 0; ti < targets.length; ti++) {
      if (visited[ti] || targets[ti] === left[li].serialNumber) continue;
      visited[ti] = true;
      if (takenBy[ti] === -1 || augment(takenBy[ti])) {
        takenBy[ti] = li;
        return true;
      }
    }
    return false;
  };

  for (let li = 0; li < left.length; li++) {
    visited.fill(false);
    if (!augment(li)) return null;
  }

  const result = new Map<string, number>();
  for (let ti = 0; ti < targets.length; ti++) {
    const li = takenBy[ti];
    if (li !== -1) result.set(left[li].id, targets[ti]);
  }
  return result.size === left.length ? result : null;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Check a participant's assignment by phone number.
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
      phase: ExchangePhase;
      /** True when this participant's pick is unclaimed and may be changed now. */
      canRepick: boolean;
    }
  | { success: false; error: string }
> {
  try {
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedPhone) {
      return { success: false, error: "Phone number is required" };
    }

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

    const me = {
      name: participant.name,
      serialNumber: participant.serialNumber,
      phoneNumber: participant.phoneNumber,
      location: participant.location || undefined,
    };

    const phase = exchangePhaseAt();

    // No pick yet (blank pick, resolved by the draw after the deadline).
    if (participant.selectedNumber === null) {
      return {
        success: true,
        participant: me,
        assignedTo: null,
        phase,
        canRepick: false,
        message:
          "You let the draw decide. Your giftee will be revealed once the draw is run after the deadline.",
      };
    }

    const assignedTo = allParticipants.find(
      (p) => p.serialNumber === participant.selectedNumber
    );

    // Pick points at a serial nobody registered (orphan pick). The re-pick
    // window gives the picker a chance to choose again before the draw.
    if (!assignedTo) {
      const orphanPhaseMessage =
        phase === "signup"
          ? `You chose to gift serial #${participant.selectedNumber}, which isn't registered yet. If nobody claims it by the deadline, you'll be able to pick a new serial then.`
          : phase === "grace"
            ? `Serial #${participant.selectedNumber} was never claimed. The re-pick window is open, so you can choose a new serial below.`
            : `Serial #${participant.selectedNumber} was never claimed. The re-pick window has closed, so the draw will assign you a new match.`;

      return {
        success: true,
        participant: me,
        assignedTo: null,
        phase,
        canRepick: phase === "grace",
        message: orphanPhaseMessage,
      };
    }

    return {
      success: true,
      participant: me,
      assignedTo: {
        name: assignedTo.name,
        serialNumber: assignedTo.serialNumber,
        phoneNumber: assignedTo.phoneNumber,
        location: assignedTo.location || undefined,
      },
      phase,
      canRepick: false,
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
 * Availability for every serial number in the pool, used to render the picker.
 */
export async function getNumberOptions(): Promise<NumberAvailability[]> {
  const allParticipants = await db.orm.public.Participant.all();

  const takenNumbers = new Set(
    allParticipants
      .map((p) => p.selectedNumber)
      .filter((n): n is number => n !== null)
  );
  const nameBySerial = new Map(
    allParticipants.map((p) => [p.serialNumber, p.name])
  );

  const options: NumberAvailability[] = [];
  for (let i = MIN_SERIAL; i <= MAX_SERIAL; i++) {
    options.push({
      serialNumber: i,
      taken: takenNumbers.has(i),
      ownerName: nameBySerial.get(i) ?? null,
    });
  }
  return options;
}

export type ExchangeStatus = {
  phase: ExchangePhase;
  deadlineISO: string;
  graceEndsISO: string;
  graceHours: number;
  participantCount: number;
  orphanCount: number;
};

/**
 * Current phase of the exchange plus the counts the UI needs to gate itself.
 */
export async function getExchangeStatus(): Promise<ExchangeStatus> {
  const allParticipants = await db.orm.public.Participant.all();
  const registered = new Set(allParticipants.map((p) => p.serialNumber));
  const orphanCount = allParticipants.filter(
    (p) => p.selectedNumber !== null && !registered.has(p.selectedNumber)
  ).length;

  return {
    phase: exchangePhaseAt(),
    deadlineISO: SIGNUP_DEADLINE.toISOString(),
    graceEndsISO: GRACE_ENDS.toISOString(),
    graceHours: GRACE_HOURS,
    participantCount: allParticipants.length,
    orphanCount,
  };
}

export type OrphanedPicker = {
  id: string;
  name: string;
  phoneNumber: string;
  serialNumber: number;
  /** The serial they picked, which no registered participant owns. */
  selectedNumber: number;
};

/**
 * Participants whose pick points at a serial nobody registered. These are the
 * people the admin needs to reach during the re-pick window.
 */
export async function getOrphanedPickers(): Promise<OrphanedPicker[]> {
  const allParticipants = await db.orm.public.Participant.all();
  const registered = new Set(allParticipants.map((p) => p.serialNumber));

  return allParticipants
    .filter(
      (p): p is typeof p & { selectedNumber: number } =>
        p.selectedNumber !== null && !registered.has(p.selectedNumber)
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      phoneNumber: p.phoneNumber,
      serialNumber: p.serialNumber,
      selectedNumber: p.selectedNumber,
    }))
    .sort((a, b) => a.selectedNumber - b.selectedNumber);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

type SignupResult =
  | {
      success: true;
      serialNumber: number;
      selectedNumber: number | null;
    }
  | { success: false; error: string };

/**
 * Sign up a new participant. `selectedNumber` is the serial number they want to
 * gift to; it may point at a serial nobody has registered yet (an orphan pick),
 * which the draw repairs after the deadline. Pass `null` to let the draw decide.
 */
export async function signupParticipant(
  name: string,
  phoneNumber: string,
  location: string,
  selectedNumber: number | null
): Promise<SignupResult> {
  try {
    if (exchangePhaseAt() !== "signup") {
      return {
        success: false,
        error: "Registration is closed. The signup deadline has passed.",
      };
    }

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
    if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedName)) {
      return {
        success: false,
        error: "Name can only contain letters, spaces, hyphens, and apostrophes",
      };
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
    if (!trimmedPhone.startsWith("+234")) {
      return { success: false, error: "Phone number must start with +234" };
    }
    const cleanedPhone = trimmedPhone
      .substring(4)
      .replace(/[\s\-\(\)\.]/g, "");
    if (!/^[0-9]{10}$/.test(cleanedPhone)) {
      return {
        success: false,
        error: "Please enter a valid 10-digit Nigerian phone number",
      };
    }

    // Validate the gift pick, if one was made
    const chosenNumber = selectedNumber ?? null;
    if (chosenNumber !== null) {
      if (
        !Number.isInteger(chosenNumber) ||
        chosenNumber < MIN_SERIAL ||
        chosenNumber > MAX_SERIAL
      ) {
        return {
          success: false,
          error: `Please choose a number between ${MIN_SERIAL} and ${MAX_SERIAL}`,
        };
      }
    }

    const allParticipants = await db.orm.public.Participant.all();

    // Check for duplicate phone number
    if (allParticipants.some((p) => p.phoneNumber === trimmedPhone)) {
      return { success: false, error: "This phone number is already registered" };
    }

    // The new serial number, assigned in registration order.
    const newSerialNumber = allParticipants.length + 1;

    if (chosenNumber !== null) {
      if (chosenNumber === newSerialNumber) {
        return {
          success: false,
          error: "You can't choose your own serial number",
        };
      }
      if (allParticipants.some((p) => p.selectedNumber === chosenNumber)) {
        return {
          success: false,
          error: `Number #${chosenNumber} has already been taken. Please choose another.`,
        };
      }
    }

    await db.orm.public.Participant.create({
      id: crypto.randomUUID(),
      name: trimmedName,
      phoneNumber: trimmedPhone,
      ...(trimmedLocation && { location: trimmedLocation }),
      serialNumber: newSerialNumber,
      selectedNumber: chosenNumber,
      updatedAt: new Date(),
    });

    revalidatePath("/");
    return {
      success: true,
      serialNumber: newSerialNumber,
      selectedNumber: chosenNumber,
    };
  } catch (error) {
    console.error("Signup error:", error);
    const message = error instanceof Error ? error.message : "";
    if (/selectedNumber|unique/i.test(message)) {
      return {
        success: false,
        error: "That number was just taken. Please choose another.",
      };
    }
    return {
      success: false,
      error: "An error occurred during signup. Please try again.",
    };
  }
}

export type RepickResult =
  | { success: true; selectedNumber: number | null }
  | { success: false; error: string };

/**
 * Re-pick, available only during the grace window and only to participants
 * whose current pick points at a serial nobody registered. During this window
 * signups are frozen, so only serials already registered can be chosen — a
 * re-pick therefore cannot create a fresh orphan. Pass `null` to let the draw
 * decide instead.
 */
export async function repickTarget(
  phoneNumber: string,
  selectedNumber: number | null
): Promise<RepickResult> {
  try {
    if (exchangePhaseAt() !== "grace") {
      return { success: false, error: "The re-pick window is not open right now." };
    }

    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      return { success: false, error: "Phone number is required" };
    }

    const allParticipants = await db.orm.public.Participant.all();
    const participant = allParticipants.find(
      (p) => p.phoneNumber === trimmedPhone
    );
    if (!participant) {
      return { success: false, error: "No registration found with this phone number" };
    }

    const registered = new Set(allParticipants.map((p) => p.serialNumber));
    const currentIsOrphan =
      participant.selectedNumber !== null &&
      !registered.has(participant.selectedNumber);
    if (!currentIsOrphan) {
      return {
        success: false,
        error:
          "Your current pick is valid, so there is nothing to re-pick. Only unclaimed picks can be changed here.",
      };
    }

    const chosen = selectedNumber ?? null;
    if (chosen !== null) {
      if (!Number.isInteger(chosen) || chosen < MIN_SERIAL || chosen > MAX_SERIAL) {
        return {
          success: false,
          error: `Please choose a number between ${MIN_SERIAL} and ${MAX_SERIAL}`,
        };
      }
      if (!registered.has(chosen)) {
        return {
          success: false,
          error: `Serial #${chosen} was never claimed, so it can't be picked anymore. Choose a serial someone registered.`,
        };
      }
      if (chosen === participant.serialNumber) {
        return { success: false, error: "You can't choose your own serial number" };
      }
      if (
        allParticipants.some(
          (p) => p.id !== participant.id && p.selectedNumber === chosen
        )
      ) {
        return {
          success: false,
          error: `Number #${chosen} has already been taken. Please choose another.`,
        };
      }
    }

    await db.orm.public.Participant.where({ id: participant.id }).update({
      selectedNumber: chosen,
      updatedAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/check-assignment");
    revalidatePath("/admin");

    return { success: true, selectedNumber: chosen };
  } catch (error) {
    console.error("Re-pick error:", error);
    const message = error instanceof Error ? error.message : "";
    if (/selectedNumber|unique/i.test(message)) {
      return {
        success: false,
        error: "That number was just taken. Please choose another.",
      };
    }
    return { success: false, error: "An error occurred. Please try again." };
  }
}

/**
 * Admin function: resolve gift assignments after the deadline.
 *
 * Participants who picked a valid serial keep it. Picks that point at a serial
 * nobody registered (orphan picks), at themselves, or at a number someone else
 * already holds are repaired by the draw. Everyone else is matched so that the
 * whole pool forms a single loop where each serial is gifted exactly once.
 */
export async function runLotteryDraw(): Promise<DrawResult> {
  try {
    const participants = await db.orm.public.Participant.all();

    if (participants.length < 2) {
      return {
        success: false,
        error: "Need at least 2 participants to run the lottery",
      };
    }

    const ordered = [...participants].sort(
      (a, b) => a.serialNumber - b.serialNumber
    );
    const serialSet = new Set(ordered.map((p) => p.serialNumber));
    const bySerial = new Map(ordered.map((p) => [p.serialNumber, p]));

    // 1. Keep every pick that is valid and still free.
    const usedTargets = new Set<number>();
    const finalAssignments = new Map<string, number>();
    const honoredIds = new Set<string>();

    for (const p of ordered) {
      const pick = p.selectedNumber;
      if (
        pick !== null &&
        serialSet.has(pick) &&
        pick !== p.serialNumber &&
        !usedTargets.has(pick)
      ) {
        usedTargets.add(pick);
        finalAssignments.set(p.id, pick);
        honoredIds.add(p.id);
      }
    }

    // 2. Match the rest against the serials nobody has claimed yet.
    const unassigned = ordered.filter((p) => !finalAssignments.has(p.id));
    const freeTargets = ordered
      .map((p) => p.serialNumber)
      .filter((s) => !usedTargets.has(s));

    const matched = matchTargets(unassigned, freeTargets);

    let usedFallback = false;
    if (matched) {
      for (const [id, target] of matched) finalAssignments.set(id, target);
    } else {
      // Keeping every pick makes a complete loop impossible; fall back to a
      // fresh random loop for everyone.
      usedFallback = true;
      finalAssignments.clear();
      honoredIds.clear();
      const deranged = randomDerangement(ordered.map((p) => p.serialNumber));
      ordered.forEach((p, i) => finalAssignments.set(p.id, deranged[i]));
    }

    // 3. Persist. Clear first so the unique index never collides mid-update.
    const now = new Date();
    await db.transaction(async (tx) => {
      for (const p of ordered) {
        if (p.selectedNumber !== null) {
          await tx.orm.public.Participant.where({ id: p.id }).update({
            selectedNumber: null,
            updatedAt: now,
          });
        }
      }
      for (const p of ordered) {
        await tx.orm.public.Participant.where({ id: p.id }).update({
          selectedNumber: finalAssignments.get(p.id)!,
          updatedAt: now,
        });
      }
    });

    const honored = ordered.filter((p) => honoredIds.has(p.id)).length;
    const repaired = ordered.filter(
      (p) => p.selectedNumber !== null && !honoredIds.has(p.id)
    ).length;
    const assignedByDraw = ordered.length - honored - repaired;

    const assignments: DrawAssignment[] = ordered.map((p) => {
      const target = finalAssignments.get(p.id)!;
      return {
        participant: p.name,
        serialNumber: p.serialNumber,
        assignedTo: bySerial.get(target)?.name ?? `#${target}`,
        assignedNumber: target,
      };
    });

    revalidatePath("/");
    revalidatePath("/check-assignment");
    revalidatePath("/admin");

    const message = usedFallback
      ? `Draw complete. The picks made a full loop impossible, so everyone was assigned randomly (${ordered.length} participants).`
      : `Draw complete. ${honored} pick${honored === 1 ? "" : "s"} honored, ${repaired} orphan pick${repaired === 1 ? "" : "s"} repaired, ${assignedByDraw} assigned by draw.`;

    return {
      success: true,
      message,
      count: assignments.length,
      honored,
      repaired,
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
