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

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-4 text-center p-6 rounded-lg border border-green-200 bg-green-50">
          <h2 className="text-xl font-bold text-green-800">
            🎉 Registration Successful!
          </h2>
          <p className="text-green-700">
            Thank you for joining the gift exchange! You&apos;ll receive more details
            soon.
          </p>
          <Button
            onClick={() => setSuccess(false)}
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
            {isFirstParticipant && (
              <p className="text-sm text-muted-foreground mt-2">
                You&apos;re the first to sign up! You&apos;ll be automatically assigned to
                the second participant.
              </p>
            )}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Phone/WhatsApp Number</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 XXX XXX XXX"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
          </Field>

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
