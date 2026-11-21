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
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>(
    []
  );
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    serialNumber: number;
    selectedParticipant?: {
      name: string;
      phoneNumber: string;
      serialNumber: number;
    };
  } | null>(null);

  // Load available numbers on mount and refresh periodically
  useEffect(() => {
    async function loadData() {
      const [numbers, count] = await Promise.all([
        getAvailableNumbers(),
        getParticipantCount(),
      ]);
      setAvailableNumbers(numbers);
      setParticipantCount(count);
    }

    loadData();

    // Refresh every 5 seconds to show real-time updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const selectedNum =
        participantCount === 0
          ? null
          : selectedNumber
            ? parseInt(selectedNumber, 10)
            : null;

      const result = await signupParticipant(name, phoneNumber, selectedNum);

      if (result.success) {
        setSuccess(true);
        setSuccessData({
          serialNumber: result.serialNumber,
          selectedParticipant: result.selectedParticipant,
        });
        setName("");
        setPhoneNumber("");
        setSelectedNumber("");

        // Refresh the available numbers
        const [numbers, count] = await Promise.all([
          getAvailableNumbers(),
          getParticipantCount(),
        ]);
        setAvailableNumbers(numbers);
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
            {successData.selectedParticipant ? (
              <div className="mt-4 p-4 bg-white rounded-lg border border-green-300">
                <p className="font-semibold mb-2">You will be gifting to:</p>
                <p className="text-lg font-bold text-green-800">
                  {successData.selectedParticipant.name}
                </p>
                <p className="text-sm text-gray-600">
                  Serial #{successData.selectedParticipant.serialNumber}
                </p>
                <p className="text-sm text-gray-600">
                  {successData.selectedParticipant.phoneNumber}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm">
                You&apos;ll be gifting to the second participant who signs up!
              </p>
            )}
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
              Pick your number and discover the joy of giving
            </FieldDescription>
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
            <Input
              id="phone"
              type="tel"
              placeholder="+234 XXX XXX XXX"
              required
              pattern="[\+]?[0-9\s\-\(\)\.]{10,20}"
              title="Please enter a valid phone number (10-15 digits)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
            <FieldDescription>
              Include country code (e.g., +234)
            </FieldDescription>
          </Field>

          {isFirstParticipant && (
            <Alert className="max-w-md py-4 px-2.5 bg-blue-100 text-blue-500">
              <AlertTitle>Notice:</AlertTitle>
              <AlertDescription className="text-blue-500 text-balance">
                You&apos;re the first to sign up! You&apos;ll be automatically
                assigned to the second participant.
              </AlertDescription>
            </Alert>
          )}

          {!isFirstParticipant && (
            <Field>
              <FieldLabel htmlFor="giftee">Who will you gift to?</FieldLabel>
              <Select
                value={selectedNumber || undefined}
                onValueChange={(value) => setSelectedNumber(value || "")}
                disabled={isLoading || availableNumbers.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a number" />
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
                {availableNumbers.length} number
                {availableNumbers.length !== 1 ? "s" : ""} available
              </FieldDescription>
            </Field>
          )}

          <Field>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
