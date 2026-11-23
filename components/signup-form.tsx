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
import {
  getExchangeStatus,
  getNumberOptions,
  signupParticipant,
} from "@/app/actions";
import type { NumberAvailability } from "@/app/actions";
import { CountdownTimer } from "@/components/countdown-timer";
import { DEADLINE_ISO, GRACE_HOURS, type ExchangePhase } from "@/lib/exchange";

const NO_PICK = "none";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [giftNumber, setGiftNumber] = useState<string>(NO_PICK);
  const [participantCount, setParticipantCount] = useState(0);
  const [phase, setPhase] = useState<ExchangePhase>("signup");
  const [numberOptions, setNumberOptions] = useState<NumberAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    serialNumber: number;
    selectedNumber: number | null;
  } | null>(null);

  // The serial this person will get if they sign up now.
  const reservedSerial = participantCount + 1;

  // Load participant count, current phase, and live number availability.
  useEffect(() => {
    async function loadData() {
      try {
        const [status, options] = await Promise.all([
          getExchangeStatus(),
          getNumberOptions(),
        ]);
        setParticipantCount(status.participantCount);
        setPhase(status.phase);
        setNumberOptions(options);
        setLoadError(null);
      } catch {
        setLoadError(
          "Couldn't load the available serial numbers. Please refresh the page — if this keeps happening, contact the organiser."
        );
      }
    }

    loadData();

    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedOption =
    giftNumber === NO_PICK
      ? null
      : numberOptions.find((o) => o.serialNumber === Number(giftNumber)) ?? null;
  const selectionTaken = selectedOption?.taken ?? false;

  function optionLabel(option: NumberAvailability) {
    if (option.serialNumber === reservedSerial) {
      return `#${option.serialNumber} · reserved for you`;
    }
    if (option.taken) {
      return `#${option.serialNumber} · taken`;
    }
    if (option.ownerName) {
      return `#${option.serialNumber}`;
    }
    return `#${option.serialNumber} · not yet registered`;
  }

  function currentSelectionLabel(value: unknown) {
    const v = typeof value === "string" ? value : null;
    if (!v || v === NO_PICK) return "Let the draw decide";
    const option = numberOptions.find((o) => o.serialNumber === Number(v));
    return option ? optionLabel(option) : `#${v}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Prepend +234 to the phone number
      const fullPhoneNumber = `+234${phoneNumber.replace(/\s/g, "")}`;
      const selectedNumber = giftNumber === NO_PICK ? null : Number(giftNumber);

      const result = await signupParticipant(
        name,
        fullPhoneNumber,
        location,
        selectedNumber
      );

      if (result.success) {
        setSuccess(true);
        setSuccessData({
          serialNumber: result.serialNumber,
          selectedNumber: result.selectedNumber,
        });
        setName("");
        setPhoneNumber("");
        setLocation("");
        setGiftNumber(NO_PICK);

        // Refresh the participant count, phase, and availability
        const [status, options] = await Promise.all([
          getExchangeStatus(),
          getNumberOptions(),
        ]);
        setParticipantCount(status.participantCount);
        setPhase(status.phase);
        setNumberOptions(options);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success && successData) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-4 text-center p-6 rounded-lg border border-green-200 bg-green-50">
          <h2 className="text-xl font-bold text-green-800">
            🎉 Registration Successful!
          </h2>
          <div className="text-green-700 space-y-2">
            <p>Your serial number is: <strong>#{successData.serialNumber}</strong></p>
            {successData.selectedNumber !== null ? (
              <p>
                You chose to gift: <strong>#{successData.selectedNumber}</strong>
              </p>
            ) : (
              <p className="text-sm">
                Your giftee will be decided by the draw.
              </p>
            )}
            <p className="mt-4 text-sm">
              Final assignments are revealed after the signup deadline on <strong>November 25th at midnight</strong>.
            </p>
          </div>
          <Button
            onClick={() => {
              setSuccess(false);
              setSuccessData(null);
            }}
            className="mt-4"
          >
            Register Another Person
          </Button>

          <div className="text-center mt-2">
            <a
              href="/check-assignment"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Check your assignment later
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (phase !== "signup") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-3 text-center p-6 rounded-lg border border-red-200 bg-red-50">
          <h2 className="text-xl font-bold text-red-800">
            🔒 Registration Closed
          </h2>
          <FieldDescription>
            The signup deadline has passed. {participantCount}{" "}
            {participantCount === 1 ? "participant" : "participants"} registered.
          </FieldDescription>
          <p className="text-sm text-red-700">
            {phase === "grace"
              ? `If you picked a serial that nobody registered, the re-pick window is open for ${GRACE_HOURS} hours. Check your assignment to choose again.`
              : "The re-pick window has closed. Assignments are revealed after the draw."}
          </p>
          <a
            href="/check-assignment"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Check your assignment
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-xl font-bold">Silent Night, Secret Gifts.</h1>
            <FieldDescription>
              Sign up for the gift exchange. Pick the serial number you want to gift, or let the draw decide.
            </FieldDescription>

            {/* Participant Count */}
            {!loadError && (
              <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-semibold text-blue-800">
                  {participantCount} {participantCount === 1 ? 'participant' : 'participants'} registered
                </p>
              </div>
            )}

            {/* Countdown Timer */}
            <CountdownTimer deadline={DEADLINE_ISO} />
          </div>

          {(error || loadError) && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              {error || loadError}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="name">Your Name:</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              minLength={2}
              maxLength={100}
              pattern="[a-zA-Z\s\-'\.]+"
              title="Name can only contain letters, spaces, hyphens, and apostrophes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
            <FieldDescription>
              At least 2 characters, letters only
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Phone/WhatsApp Number</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none text-sm leading-loose">
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
              Enter your number without the country code
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              type="text"
              placeholder="e.g., Lagos, Abuja, Port Harcourt"
              required
              minLength={2}
              maxLength={100}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isLoading}
            />
            <FieldDescription>
              Your city or area
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="giftNumber">Gift to serial number</FieldLabel>
            <Select
              value={giftNumber}
              onValueChange={(value) =>
                setGiftNumber(value == null ? NO_PICK : String(value))
              }
              disabled={isLoading}
            >
              <SelectTrigger id="giftNumber" className="w-full">
                <SelectValue>{currentSelectionLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PICK}>Let the draw decide</SelectItem>
                {numberOptions.map((option) => (
                  <SelectItem
                    key={option.serialNumber}
                    value={String(option.serialNumber)}
                    disabled={
                      option.taken || option.serialNumber === reservedSerial
                    }
                  >
                    {optionLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Pick whose serial number you&apos;ll gift. Taken numbers are
              unavailable; you can also gift a serial that hasn&apos;t signed up
              yet.
            </FieldDescription>
            {selectionTaken && (
              <p className="text-sm text-red-600">
                That number was just taken. Please choose another.
              </p>
            )}
          </Field>

          <Field>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </Field>

          <div className="text-center">
            <a
              href="/check-assignment"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Already registered? Check your assignment
            </a>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
