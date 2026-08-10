// app/alerts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpaceWeather } from "@/providers/space-weather-provider";
import { useThresholds } from "@/hooks/use-thresholds";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SourceWarningBanner from "@/components/source-warning-banner";
import ThresholdAlertBanner from "@/components/threshold-alert-banner";
import ThresholdManager from "@/components/threshold-manager";
import EmailAlertToggle from "@/components/email-alert-toggle";

export default function AlertsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const data = useSpaceWeather();
  const {
    thresholds,
    breachedAlerts,
    isLoading,
    addThreshold,
    updateThreshold,
    deleteThreshold,
  } = useThresholds(data);
  const {
    preferences,
    isLoading: prefsLoading,
    updateEmailAlertsEnabled,
  } = useUserPreferences();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      } else {
        setUser(user);
        setUserEmail(user.email || "");
      }
    };

    checkAuth();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-faint-star">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-starlight">
              Personal Alert Thresholds
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-deep-indigo/60 rounded-full border border-void-navy">
              <User size={14} className="text-faint-star" />
              <span className="text-xs text-faint-star">{userEmail}</span>
            </div>
          </div>
          <p className="text-sm text-faint-star">
            Set your own limits for Kp, solar wind speed, and Bz. Kairo monitors
            conditions and surfaces a banner when your thresholds are breached.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-faint-star hover:text-starlight hover:bg-void-navy"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </div>

      <EmailAlertToggle
        enabled={preferences?.email_alerts_enabled || false}
        emailVerified={preferences?.email_verified || false}
        userEmail={userEmail}
        onToggle={updateEmailAlertsEnabled}
      />

      <SourceWarningBanner warnings={data.warnings} />

      <ThresholdAlertBanner breachedAlerts={breachedAlerts} />

      <ThresholdManager
        thresholds={thresholds}
        isLoading={isLoading}
        onAdd={addThreshold}
        onEdit={updateThreshold}
        onDelete={deleteThreshold}
      />
    </div>
  );
}
