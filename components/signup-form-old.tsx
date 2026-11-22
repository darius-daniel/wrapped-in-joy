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
import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { SelectContent } from "./ui/select";
import {
  getAvailableNumbers,
  getParticipantCount,
  signupParticipant,
  type AvailableNumber,
} from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    serialNumber: number;
  } | null>(null);

  // Load participant count
  useEffect(() => {
    async function loadData() {
      const count = await getParticipantCount();
      setParticipantCount(count);
    }

    loadData();

    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const [participantCount, setParticipantCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Prepend +234 to the phone number
      const fullPhoneNumber = `+234${phoneNumber.replace(/\s/g, '')}`;

      const result = await signupParticipant(name, fullPhoneNumber, location, null);

      if (result.success) {
        setSuccess(true);
        setSuccessData({
          serialNumber: result.serialNumber,
        });
        setName("");
        setPhoneNumber("");
        setLocation("");

        // Refresh the participant count
        const count = await getParticipantCount();
        setParticipantCount(count);
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
            <p className="mt-4 text-sm">
              Your gift assignment will be revealed after the signup deadline on <strong>November 25th at midnight</strong>.
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

  const isFirstParticipant = participantCount === 0;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Silent Night, Secret Gifts.</h1>
            <FieldDescription>
              Join the gift exchange lottery
            </FieldDescription>

            {/* Participant Count */}
            <div className="mt-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-semibold text-blue-800">
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'} registered
              </p>
            </div>

            {/* Countdown Timer */}
            <CountdownTimer deadline="2024-11-25T00:00:00" />
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
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
            <FieldLabel htmlFor="giftee">
              Who will you gift to? {isFirstParticipant && "(Optional for first participant)"}
            </FieldLabel>
            <Select
              value={selectedNumber || undefined}
              onValueChange={(value) => setSelectedNumber(value || "")}
              disabled={isLoading || availableNumbers.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a number (1-100)" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {availableNumbers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available numbers
                    </SelectItem>
                  ) : (
                    availableNumbers.map((item) => (
                      <SelectItem
                        key={item.serialNumber}
                        value={item.serialNumber.toString()}
                      >
                        #{item.serialNumber} - {item.name}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              {isFirstParticipant
                ? "You can select any number 1-100, or skip and select later."
                : `Select any number 1-100. Numbers marked "(not yet registered)" may be assigned later. ${availableNumbers.length} available.`}
            </FieldDescription>
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
