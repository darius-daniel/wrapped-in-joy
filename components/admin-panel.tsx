"use client";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getExchangeStatus,
  getOrphanedPickers,
  runLotteryDraw,
} from "@/app/actions";
import type {
  DrawResult,
  ExchangeStatus,
  OrphanedPicker,
} from "@/app/actions";

const PHASE_LABEL: Record<ExchangeStatus["phase"], string> = {
  signup: "Signup open",
  grace: "Re-pick window open",
  closed: "Re-pick window closed",
};

async function loadOverview() {
  const [status, orphans] = await Promise.all([
    getExchangeStatus(),
    getOrphanedPickers(),
  ]);
  return { status, orphans };
}

/**
 * A click-to-send WhatsApp link, pre-filled with the re-pick instructions. The
 * admin sends it from their own account, so no messaging provider is involved.
 */
function whatsappLink(
  orphan: OrphanedPicker,
  origin: string,
  graceEndsISO: string
) {
  const digits = orphan.phoneNumber.replace(/\D/g, "");
  const when = graceEndsISO
    ? new Date(graceEndsISO).toLocaleString()
    : "the re-pick deadline";
  const text =
    `Hi ${orphan.name}! You picked serial #${orphan.selectedNumber} in the gift exchange, ` +
    `but nobody registered as that serial, so it can never be claimed. ` +
    `Please pick a new serial (or let the draw decide) at ${origin}/check-assignment ` +
    `before ${when}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function AdminPanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [status, setStatus] = useState<ExchangeStatus | null>(null);
  const [orphans, setOrphans] = useState<OrphanedPicker[]>([]);

  // The orphan list only exists after the client-side load, so the server render
  // never contains a wa.me link and reading location here cannot mismatch.
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  useEffect(() => {
    let active = true;

    async function load() {
      const overview = await loadOverview();
      if (!active) return;
      setStatus(overview.status);
      setOrphans(overview.orphans);
    }

    load();
    // Keep the phase and orphan list fresh while the admin sits on the page.
    const interval = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleLotteryDraw = async () => {
    if (!confirm("Are you sure you want to run the lottery draw? This will assign all participants randomly.")) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await runLotteryDraw();
      setResult(response);

      const overview = await loadOverview();
      setStatus(overview.status);
      setOrphans(overview.orphans);
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
          <h2 className="text-lg font-semibold mb-4">🔁 Re-pick Window</h2>

          {status ? (
            <>
              <p className="text-sm text-gray-600">
                Phase: <strong>{PHASE_LABEL[status.phase]}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Signups close {new Date(status.deadlineISO).toLocaleString()} ·
                re-pick window ends {new Date(status.graceEndsISO).toLocaleString()} ({status.graceHours}h)
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {status.participantCount} registered · {status.orphanCount} with
                an unclaimed pick
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Loading…</p>
          )}

          {orphans.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm text-gray-700 mb-2">
                These participants picked a serial nobody registered. Message
                each one so they can re-pick before the draw:
              </p>
              <div className="space-y-2">
                {orphans.map((orphan) => (
                  <div
                    key={orphan.id}
                    className="flex items-center justify-between gap-3 p-3 rounded border border-amber-200 bg-amber-50"
                  >
                    <div className="text-sm">
                      <div className="font-semibold text-amber-900">
                        {orphan.name}{" "}
                        <span className="font-normal">#{orphan.serialNumber}</span>
                      </div>
                      <div className="text-xs text-amber-800">
                        picked #{orphan.selectedNumber} · {orphan.phoneNumber}
                      </div>
                    </div>
                    <a
                      href={whatsappLink(
                        orphan,
                        origin,
                        status?.graceEndsISO ?? ""
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Send WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-3">
              No unclaimed picks right now.
            </p>
          )}
        </div>

        <div className="p-6 rounded-lg border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-4">🎰 Run Lottery Draw</h2>
          <p className="text-sm text-gray-600 mb-4">
            After the re-pick window closes, run the lottery to randomly assign all participants to each other. Everyone will be matched in a complete gift exchange loop.
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
                {result.success ? result.message : result.error}
              </p>

              {result.success && result.repaired > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  ⚠️ {result.repaired} pick{result.repaired !== 1 ? "s" : ""} pointed at a serial with no registered participant and {result.repaired !== 1 ? "were" : "was"} repaired with a fresh match.
                </p>
              )}

              {result.success && result.count > 0 && (
                <div className="mt-3 max-h-96 overflow-y-auto">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Assigned {result.count} participant{result.count !== 1 ? "s" : ""}:
                  </p>
                  <div className="space-y-1 text-xs text-green-700">
                    {result.assignments.map((assignment, index) => (
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
              <strong>1. Signup Phase:</strong> Participants register with name, phone, and location, and may optionally pick a serial number to gift.
            </p>
            <p>
              <strong>2. Deadline:</strong> Registration closes on November 25th at midnight.
            </p>
            <p>
              <strong>3. Re-pick Window:</strong> Anyone whose pick points at a serial nobody registered is messaged above and can choose a different serial from the check-assignment page.
            </p>
            <p>
              <strong>4. Lottery Draw:</strong> Click the button above to finalize assignments. Valid picks are honored; anyone still unclaimed is matched, so each person is gifted exactly once.
            </p>
            <p>
              <strong>5. Check Assignment:</strong> Participants can then check who they&apos;re gifting to on the &quot;/check-assignment&quot; page.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Go to Signup Page
          </Link>
          {" | "}
          <Link
            href="/check-assignment"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Check Assignment
          </Link>
        </div>
      </div>
    </div>
  );
}
