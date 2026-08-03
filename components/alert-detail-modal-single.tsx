"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import type { Alert } from "@/types/spacewx";

interface AlertDetailModalSingleProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AlertDetailModalSingle({
  alert,
  open,
  onOpenChange,
}: AlertDetailModalSingleProps) {
  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-deep-indigo border-void-navy text-starlight sm:max-w-[90vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-starlight font-display text-lg flex items-center gap-2">
            <AlertTriangle size={18} className="text-solar-amber" />
            Alert Details
          </DialogTitle>
          <DialogDescription className="text-faint-star">
            Full alert message from NOAA.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1 mt-4 space-y-3">
          <div className="rounded-lg border border-void-navy bg-void-navy/50 p-4">
            <p className="text-sm leading-relaxed text-starlight whitespace-pre-wrap break-words">
              {alert.message}
            </p>
            <p className="mt-3 text-xs text-faint-star">
              Issued: {new Date(alert.issueTime).toLocaleString("en-US")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
