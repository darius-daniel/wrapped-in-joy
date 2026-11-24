"use client";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { checkAssignment, getNumberOptions, repickTarget } from "@/app/actions";
import type { NumberAvailability } from "@/app/actions";
import type { ExchangePhase } from "@/lib/exchange";
import Link from "next/link";

const NO_PICK = "none";

export function CheckAssignmentForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
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
    canRepick: boolean;
  } | null>(null);

  const [options, setOptions] = useState<NumberAvailability[]>([]);
  const [newPick, setNewPick] = useState<string>(NO_PICK);
  const [repickError, setRepickError] = useState<string | null>(null);
  const [isRepicking, setIsRepicking] = useState(false);

  // Load the serials open to a re-pick once we know the caller needs one.
  useEffect(() => {
    if (!result?.canRepick) return;
    let active = true;

    async function loadOptions() {
      try {
        const loaded = await getNumberOptions();
        if (!active) return;
        setOptions(loaded);
        setRepickError(null);
      } catch {
        if (!active) return;
        setRepickError(
          "Couldn't load the available serials. Please refresh the page and try again."
        );
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, [result?.canRepick]);

  // Serials someone registered that nobody has claimed yet (and not their own).
  const repickOptions = result
    ? options.filter(
        (option) =>
          option.registered &&
          !option.taken &&
          option.serialNumber !== result.participant.serialNumber
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      // Prepend +234 to the phone number
      const fullPhoneNumber = `+234${phoneNumber.replace(/\s/g, '')}`;

      const response = await checkAssignment(fullPhoneNumber);

      if (response.success && 'participant' in response) {
        setResult({
          participant: response.participant,
          assignedTo: response.assignedTo || null,
          message: response.message,
          phase: response.phase,
          canRepick: response.canRepick,
        });
      } else if (!response.success && 'error' in response) {
        setError(response.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepick = async () => {
    if (!result) return;
    setIsRepicking(true);
    setRepickError(null);

    try {
      const response = await repickTarget(
        result.participant.phoneNumber,
        newPick === NO_PICK ? null : Number(newPick)
      );

      if (!response.success) {
        setRepickError(response.error);
        return;
      }

      // Re-read so the view reflects the new pick (or the draw-decides state).
      const refreshed = await checkAssignment(result.participant.phoneNumber);
      if (refreshed.success && "participant" in refreshed) {
        setResult({
          participant: refreshed.participant,
          assignedTo: refreshed.assignedTo || null,
          message: refreshed.message,
          phase: refreshed.phase,
          canRepick: refreshed.canRepick,
        });
      }
    } catch {
      setRepickError("An unexpected error occurred. Please try again.");
    } finally {
      setIsRepicking(false);
    }
  };

  const handleCheckAnother = () => {
    setPhoneNumber("");
    setResult(null);
    setError(null);
    setNewPick(NO_PICK);
    setRepickError(null);
    setOptions([]);
  };

  if (result) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Your Assignment</h1>
          </div>

          <div className="p-6 rounded-lg border border-blue-200 bg-blue-50">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-1">You are:</p>
              <p className="text-lg font-bold text-blue-800">
                {result.participant.name}
              </p>
              <p className="text-sm text-gray-600">
                Serial #{result.participant.serialNumber}
              </p>
            </div>

            <div className="border-t border-blue-300 my-4"></div>

            {result.assignedTo ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  You will be gifting to:
                </p>
                <div className="p-4 bg-white rounded-lg border border-blue-300">
                  <p className="text-xl font-bold text-blue-800 mb-1">
                    {result.assignedTo.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Serial #{result.assignedTo.serialNumber}
                  </p>
                  {result.assignedTo.location && (
                    <p className="text-sm text-gray-600 mt-1">
                      📍 {result.assignedTo.location}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    📞 {result.assignedTo.phoneNumber}
                  </p>
                </div>
              </div>
            ) : result.canRepick ? (
              <div>
                <p className="text-sm text-amber-800 text-center">
                  ⚠️ {result.message}
                </p>

                <div className="mt-4">
                  <Field>
                    <FieldLabel htmlFor="repick">
                      Choose a new serial to gift
                    </FieldLabel>
                    <Select
                      value={newPick}
                      onValueChange={(value) =>
                        setNewPick(value == null ? NO_PICK : String(value))
                      }
                      disabled={isRepicking}
                    >
                      <SelectTrigger id="repick" className="w-full">
                        <SelectValue>
                          {(value: unknown) => {
                            const v =
                              typeof value === "string" ? value : NO_PICK;
                            if (v === NO_PICK) return "Let the draw decide";
                            const option = repickOptions.find(
                              (o) => o.serialNumber === Number(v)
                            );
                            return option
                              ? `#${option.serialNumber}`
                              : `#${v}`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PICK}>
                          Let the draw decide
                        </SelectItem>
                        {repickOptions.map((option) => (
                          <SelectItem
                            key={option.serialNumber}
                            value={String(option.serialNumber)}
                          >
                            #{option.serialNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Only serials someone registered and nobody has picked yet
                      can be chosen. Signups are closed, so unclaimed serials are
                      no longer available.
                    </FieldDescription>
                  </Field>

                  {repickError && (
                    <p className="text-sm text-red-600 mt-2">{repickError}</p>
                  )}

                  <Button
                    onClick={handleRepick}
                    disabled={isRepicking}
                    className="w-full mt-4"
                  >
                    {isRepicking ? "Saving..." : "Save new pick"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600">⏳</p>
                <p className="text-sm text-gray-700 mt-2">
                  {result.message || "Waiting for assignment..."}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Check back later or we&apos;ll notify you!
                </p>
              </div>
            )}
          </div>

          <Button onClick={handleCheckAnother} variant="outline">
            Check Another Number
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Check Your Assignment</h1>
            <FieldDescription>
              Enter your phone number to see who you&apos;re gifting to
            </FieldDescription>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="phone">Your Phone/WhatsApp Number</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none text-sm">
                +234
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="803 123 4567"
                required
                pattern="[0-9\s]{10,15}"
                title="Please enter a valid phone number (10 digits)"
                value={phoneNumber}
                onChange={(e) => {
                  // Only allow numbers and spaces
                  const value = e.target.value.replace(/[^\d\s]/g, '');
                  setPhoneNumber(value);
                }}
                disabled={isLoading}
                className="pl-14"
              />
            </div>
            <FieldDescription>
              Use the same number you registered with (without +234)
            </FieldDescription>
          </Field>

          <Field>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Checking..." : "Check Assignment"}
            </Button>
          </Field>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Haven&apos;t registered yet? Sign up here
            </Link>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
