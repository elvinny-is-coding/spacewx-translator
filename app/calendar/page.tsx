// app/calendar/page.tsx
"use client";

import AuroraCalendar from "@/components/aurora-calendar";

export default function CalendarPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-starlight">
          Aurora Calendar
        </h2>
        <p className="text-sm text-faint-star">
          Pick a location and browse the month to see which days have a chance
          of aurora. Days are color‑coded by the strongest Kp forecast for that
          date.
        </p>
      </div>

      <AuroraCalendar />
    </div>
  );
}
