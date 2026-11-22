"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  deadline: string; // ISO format: "2024-11-25T00:00:00"
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    function calculateTimeLeft() {
      const difference = new Date(deadline).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (isExpired) {
    return (
      <div className="w-full max-w-md p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-center text-red-800 font-semibold">
          🔒 Registration Closed
        </p>
        <p className="text-center text-red-600 text-sm mt-1">
          Signup deadline has passed
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-4 rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200">
      <p className="text-center text-sm font-semibold text-gray-700 mb-3">
        ⏰ Registration closes in:
      </p>
      <div className="flex justify-center gap-2 sm:gap-4">
        <FlipCard value={timeLeft.days} label="Days" />
        <div className="flex items-center pb-6 text-2xl font-bold text-gray-400">:</div>
        <FlipCard value={timeLeft.hours} label="Hours" />
        <div className="flex items-center pb-6 text-2xl font-bold text-gray-400">:</div>
        <FlipCard value={timeLeft.minutes} label="Mins" />
        <div className="flex items-center pb-6 text-2xl font-bold text-gray-400">:</div>
        <FlipCard value={timeLeft.seconds} label="Secs" />
      </div>
      <p className="text-center text-xs text-gray-600 mt-3">
        Midnight, November 25th, 2026
      </p>
    </div>
  );
}

const FlipCard = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-16 h-20 sm:w-20 sm:h-24">
      {/* Flip card container */}
      <div className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-gray-800 to-gray-900 rounded-lg shadow-lg">
        <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      {/* Middle line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-950 opacity-30" />
    </div>
    <span className="text-xs sm:text-sm text-gray-600 mt-2 font-medium uppercase">
      {label}
    </span>
  </div>
);
