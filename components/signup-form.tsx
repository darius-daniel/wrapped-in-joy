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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createParticipant, getAvailableNumbers } from "@/app/actions";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNumber, setSelectedNumber] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [nextSerialNumber, setNextSerialNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load available numbers on mount and after submission
  const loadAvailableNumbers = async () => {
    try {
      const data = await getAvailableNumbers();
      setAvailableNumbers(data.serialNumbers);
      setNextSerialNumber(data.nextSerialNumber);
    } catch (err) {
      console.error("Error loading available numbers:", err);
    }
  };

  loadAvailableNumbers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // First participant doesn't need to select a number
      // const isFirstParticipant = nextSerialNumber === 1;

      const result = await createParticipant({
        name,
        phoneNumber,
        selectedNumber: selectedNumber ? parseInt(selectedNumber) : undefined,
      });

      if (result.success) {
        setSuccess(true);
        setName("");
        setPhoneNumber("");
        setSelectedNumber("");
        await loadAvailableNumbers();
        router.refresh();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to sign up");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

          <Field>
            <FieldLabel htmlFor="name">Your Name:</FieldLabel>
            <Input
              id="name"
              type="tel"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Phone/WhatsApp Number</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 XXX XXX XXX"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Who will you gift to?</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 XXX XXX XXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          <Field>
            <Button type="submit">Submit</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
