"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type { Threshold, ThresholdAlert } from "@/types/threshold";
import type { SpaceWeatherData } from "@/types/spacewx";
import { evaluateThresholds } from "@/lib/thresholds";
import { generateUUID } from "@/lib/utils";

const USER_ID_KEY = "spacewx-user-id";

function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

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
  const userId = getUserId();

  // Fetch thresholds from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchThresholds() {
      try {
        const res = await fetch(`/api/thresholds?user_id=${userId}`);
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
  }, [userId]);

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
            user_id: userId,
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
    [userId],
  );

  const updateThreshold = useCallback(
    async (id: string, updates: Partial<Threshold>) => {
      try {
        const res = await fetch(`/api/thresholds/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, ...updates }),
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
    [userId],
  );

  const deleteThreshold = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/thresholds/${id}?user_id=${userId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete threshold");
        setThresholds((prev) => prev.filter((t) => t.id !== id));
        toast.success("Threshold removed");
      } catch (err) {
        toast.error("Could not delete threshold");
      }
    },
    [userId],
  );

  const breachedAlerts = useMemo(() => {
    if (!data) return [];
    return evaluateThresholds(thresholds, data);
  }, [data, thresholds]);

  return {
    thresholds,
    breachedAlerts,
    isLoading,
    addThreshold,
    updateThreshold,
    deleteThreshold,
  };
}
