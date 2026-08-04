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
          <h2 className="font-display text-2xl text-starlight">
            Event Timeline
          </h2>
          <p className="text-sm text-faint-star">
            A chronological view of solar flares, CMEs, geomagnetic storms,
            radiation storms, and Kp spikes — across the time range you choose.
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
            Official notices from NOAA when space weather events could affect
            satellites, power grids, or radio communications.
          </p>
        </div>
        <ActiveAlerts alerts={data.alerts} />
      </section>
    </div>
  );
}
