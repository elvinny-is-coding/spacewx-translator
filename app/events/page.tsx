// app/events/page.tsx
"use client";

import EventTimeline from "@/components/event-timeline";
import ActiveAlerts from "@/components/active-alerts";
import { useSpaceWeather } from "@/providers/space-weather-provider";

export default function EventsPage() {
  const data = useSpaceWeather();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-starlight">Solar Events</h2>
          <p className="text-sm text-faint-star">
            A timeline of solar flares, CMEs, geomagnetic storms, and Kp spikes
            curated by Kairo.
          </p>
        </div>
        <EventTimeline />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-starlight">
            Active Alerts
          </h2>
          <p className="text-sm text-faint-star">
            Official NOAA alerts — Kairo helps you separate the signal from the
            noise.
          </p>
        </div>
        <ActiveAlerts alerts={data.alerts} />
      </section>
    </div>
  );
}
