"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UserPreferences {
  email_alerts_enabled: boolean;
  email_verified: boolean;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  updateEmailAlertsEnabled: (enabled: boolean) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPreferences(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/user-preferences");
      
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      console.error("Failed to fetch user preferences:", err);
      setError("Failed to load preferences");
      setPreferences({
        email_alerts_enabled: false,
        email_verified: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const updateEmailAlertsEnabled = useCallback(async (enabled: boolean) => {
    try {
      const response = await fetch("/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_alerts_enabled: enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      console.error("Failed to update email alert preferences:", err);
      toast.error("Failed to update email preferences");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updateEmailAlertsEnabled,
    refreshPreferences: fetchPreferences,
  };
}
