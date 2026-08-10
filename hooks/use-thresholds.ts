"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Threshold, ThresholdAlert } from "@/types/threshold";
import type { SpaceWeatherData } from "@/types/spacewx";
import { evaluateThresholds } from "@/lib/thresholds";
import { createClient } from "@/lib/supabase/client";

interface UseThresholdsReturn {
  thresholds: Threshold[];
  breachedAlerts: ThresholdAlert[];
  isLoading: boolean;
  addThreshold: (
    parameter: Threshold["parameter"],
    operator: Threshold["operator"],
    value: number,
    label?: string,
  ) => void;
  updateThreshold: (id: string, updates: Partial<Threshold>) => void;
  deleteThreshold: (id: string) => void;
}

export function useThresholds(
  data: SpaceWeatherData | null,
): UseThresholdsReturn {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const previousBreachedIds = useRef<Set<string>>(new Set());

  // Fetch thresholds from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchThresholds() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (!cancelled) {
            setThresholds([]);
            setIsLoading(false);
          }
          return;
        }

        const res = await fetch("/api/thresholds");
        if (!res.ok) throw new Error("Failed to fetch thresholds");
        const json = await res.json();
        if (!cancelled) {
          setThresholds(json.thresholds ?? []);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load thresholds:", err);
          setIsLoading(false);
        }
      }
    }
    fetchThresholds();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const addThreshold = useCallback(
    async (
      parameter: Threshold["parameter"],
      operator: Threshold["operator"],
      value: number,
      label?: string,
    ) => {
      try {
        const res = await fetch("/api/thresholds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parameter,
            operator,
            value,
            label,
          }),
        });
        if (!res.ok) throw new Error("Failed to add threshold");
        const json = await res.json();
        setThresholds((prev) => [json.threshold, ...prev]);
        toast.success("Threshold added");
      } catch (err) {
        toast.error("Could not add threshold");
      }
    },
    [],
  );

  const updateThreshold = useCallback(
    async (id: string, updates: Partial<Threshold>) => {
      try {
        const res = await fetch(`/api/thresholds/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error("Failed to update threshold");
        const json = await res.json();
        setThresholds((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...json.threshold } : t)),
        );
        toast.success("Threshold updated");
      } catch (err) {
        toast.error("Could not update threshold");
      }
    },
    [],
  );

  const deleteThreshold = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/thresholds/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete threshold");
        setThresholds((prev) => prev.filter((t) => t.id !== id));
        toast.success("Threshold removed");
      } catch (err) {
        toast.error("Could not delete threshold");
      }
    },
    [],
  );

  const breachedAlerts = useMemo(() => {
    if (!data) return [];
    return evaluateThresholds(thresholds, data);
  }, [data, thresholds]);

  // Send email alerts for new breaches
  useEffect(() => {
    const newBreaches = breachedAlerts.filter(
      alert => !previousBreachedIds.current.has(alert.threshold.id)
    );

    if (newBreaches.length > 0) {
      // Update the set of breached IDs
      const newIds = new Set(previousBreachedIds.current);
      newBreaches.forEach(alert => newIds.add(alert.threshold.id));
      previousBreachedIds.current = newIds;

      // Send email alerts
      sendEmailAlerts(newBreaches);
    }
  }, [breachedAlerts]);

  const sendEmailAlerts = async (alerts: ThresholdAlert[]) => {
    try {
      const breaches = alerts.map(alert => ({
        thresholdId: alert.threshold.id,
        thresholdLabel: alert.threshold.label || `${alert.threshold.parameter} ${alert.threshold.operator} ${alert.threshold.value}`,
        parameter: alert.threshold.parameter,
        operator: alert.threshold.operator,
        thresholdValue: alert.threshold.value,
        currentValue: alert.currentValue,
      }));

      await fetch("/api/alerts/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breaches }),
      });
    } catch (error) {
      console.error("Failed to send email alerts:", error);
    }
  };

  return {
    thresholds,
    breachedAlerts,
    isLoading,
    addThreshold,
    updateThreshold,
    deleteThreshold,
  };
}
