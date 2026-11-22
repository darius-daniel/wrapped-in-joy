"use client";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { runLotteryDraw } from "@/app/actions";

export function AdminPanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLotteryDraw = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await runLotteryDraw();
      setResult(response);
    } catch (err) {
      setResult({
        success: false,
        error: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Admin Panel</h1>
        <p className="text-center text-gray-600">
          Manage gift exchange assignments
        </p>

        <div className="p-6 rounded-lg border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-4">Reassign Unregistered Numbers</h2>
          <p className="text-sm text-gray-600 mb-4">
            After registration closes, use this to reassign participants who selected
            numbers that were never registered to actual participants.
          </p>

          <Button
            onClick={handleReassign}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Run Reassignment"}
          </Button>

          {result && (
            <div className={cn(
              "mt-4 p-4 rounded-lg",
              result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            )}>
              <h3 className={cn(
                "font-semibold mb-2",
                result.success ? "text-green-800" : "text-red-800"
              )}>
                {result.success ? "✅ Success" : "❌ Error"}
              </h3>

              <p className={cn(
                "text-sm",
                result.success ? "text-green-700" : "text-red-700"
              )}>
                {result.message || result.error}
              </p>

              {result.count > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Reassigned {result.count} participant{result.count !== 1 ? "s" : ""}:
                  </p>
                  <ul className="text-sm text-green-700 space-y-1">
                    {result.details?.map((detail: any, index: number) => (
                      <li key={index}>
                        <strong>{detail.participant}</strong>:
                        #{detail.oldNumber} (unregistered) → #{detail.newNumber} (registered)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.needReassignment && (
                <div className="mt-3 text-sm text-red-700">
                  <p>Need to reassign: {result.needReassignment}</p>
                  <p>Available slots: {result.available}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 rounded-lg border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-4">How It Works</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Problem:</strong> Participants can select any number 1-100,
              even if that person hasn't registered yet.
            </p>
            <p>
              <strong>Example:</strong> Alice selects #50, but no one ever registers
              as #50.
            </p>
            <p>
              <strong>Solution:</strong> After registration closes, run reassignment
              to assign Alice to an actual registered participant who hasn't been
              selected yet.
            </p>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/signup"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Go to Signup Page
          </a>
          {" | "}
          <a
            href="/check-assignment"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Check Assignment
          </a>
        </div>
      </div>
    </div>
  );
}
