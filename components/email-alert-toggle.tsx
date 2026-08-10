"use client";

import { useState, useEffect } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EmailAlertToggleProps {
  enabled: boolean;
  emailVerified: boolean;
  userEmail?: string;
  onToggle: (enabled: boolean) => void;
}

export default function EmailAlertToggle({
  enabled,
  emailVerified,
  userEmail,
  onToggle,
}: EmailAlertToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleToggle = async () => {
    if (!emailVerified) {
      toast.error("Please verify your email first");
      return;
    }

    setIsLoading(true);
    try {
      await onToggle(!enabled);
      toast.success(enabled ? "Email alerts disabled" : "Email alerts enabled");
    } catch (error) {
      toast.error("Failed to update email preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Verification email sent");
      } else {
        toast.error("Failed to send verification email");
      }
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-deep-indigo/60 rounded-lg border border-void-navy">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-aurora-green/10 rounded-lg">
          <Mail size={20} className="text-aurora-green" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-starlight">Email Alerts</span>
            {emailVerified ? (
              <Check size={16} className="text-aurora-green" />
            ) : (
              <AlertCircle size={16} className="text-solar-amber" />
            )}
          </div>
          <p className="text-xs text-faint-star">
            {emailVerified
              ? `Alerts will be sent to ${userEmail || "your email"}`
              : "Email verification required"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!emailVerified && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
            className="border-void-navy text-faint-star hover:bg-void-navy/50"
          >
            {isResending ? "Sending..." : "Verify Email"}
          </Button>
        )}
        <Button
          variant={enabled ? "default" : "outline"}
          size="sm"
          onClick={handleToggle}
          disabled={isLoading || !emailVerified}
          className={
            enabled
              ? "bg-aurora-green text-void-navy hover:bg-aurora-green/90"
              : "border-void-navy text-faint-star hover:bg-void-navy/50"
          }
        >
          {isLoading ? "..." : enabled ? "On" : "Off"}
        </Button>
      </div>
    </div>
  );
}
