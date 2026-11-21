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
import { useState } from "react";
import { checkAssignment } from "@/app/actions";

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
    };
    assignedTo: {
      name: string;
      serialNumber: number;
      phoneNumber: string;
    } | null;
    message?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const response = await checkAssignment(phoneNumber);

      if (response.success) {
        setResult({
          participant: response.participant,
          assignedTo: response.assignedTo || null,
          message: response.message,
        });
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAnother = () => {
    setPhoneNumber("");
    setResult(null);
    setError(null);
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
                  <p className="text-sm text-gray-600 mt-2">
                    {result.assignedTo.phoneNumber}
                  </p>
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
            <Input
              id="phone"
              type="tel"
              placeholder="+234 XXX XXX XXX"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
            <FieldDescription>
              Use the same number you registered with
            </FieldDescription>
          </Field>

          <Field>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Checking..." : "Check Assignment"}
            </Button>
          </Field>

          <div className="text-center">
            <a
              href="/signup"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Haven&apos;t registered yet? Sign up here
            </a>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
