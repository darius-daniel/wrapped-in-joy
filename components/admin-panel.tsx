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
    if (!confirm("Are you sure you want to run the lottery draw? This will assign all participants randomly.")) {
      return;
    }

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
          Manage gift exchange lottery
        </p>

        <div className="p-6 rounded-lg border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-4">🎰 Run Lottery Draw</h2>
          <p className="text-sm text-gray-600 mb-4">
            After the November 25th deadline, run the lottery to randomly assign all participants to each other. Everyone will be matched in a complete gift exchange loop.
          </p>

          <Button
            onClick={handleLotteryDraw}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Processing..." : "🎲 Run Lottery Draw"}
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

              {result.count > 0 && result.assignments && (
                <div className="mt-3 max-h-96 overflow-y-auto">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Assigned {result.count} participant{result.count !== 1 ? "s" : ""}:
                  </p>
                  <div className="space-y-1 text-xs text-green-700">
                    {result.assignments.map((assignment: any, index: number) => (
                      <div key={index} className="p-2 bg-white rounded border border-green-200">
                        <strong>#{assignment.serialNumber} {assignment.participant}</strong> → #{assignment.assignedNumber} {assignment.assignedTo}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 rounded-lg border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-4">How It Works</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>1. Signup Phase:</strong> Participants register with name, phone, and location. No selection needed.
            </p>
            <p>
              <strong>2. Deadline:</strong> Registration closes on November 25th at midnight.
            </p>
            <p>
              <strong>3. Lottery Draw:</strong> Click the button above to randomly assign everyone. Each person will be matched with someone to gift to.
            </p>
            <p>
              <strong>4. Check Assignment:</strong> Participants can then check who they're gifting to on the "/check-assignment" page.
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
