"use client";

import { useState } from "react";
import { Pencil, Trash2, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThresholdSettingsDialog from "@/components/threshold-settings-dialog";
import type { Threshold } from "@/types/threshold";

interface ThresholdManagerProps {
  thresholds: Threshold[];
  isLoading: boolean;
  onAdd: (
    parameter: Threshold["parameter"],
    operator: Threshold["operator"],
    value: number,
    label?: string,
  ) => void;
  onEdit: (id: string, updates: Partial<Threshold>) => void;
  onDelete: (id: string) => void;
}

export default function ThresholdManager({
  thresholds,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}: ThresholdManagerProps) {
  const [editingThreshold, setEditingThreshold] = useState<Threshold | null>(
    null,
  );

  if (isLoading) {
    return (
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-6">
          <p className="text-sm text-faint-star animate-pulse">
            Loading thresholds…
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-starlight flex items-center gap-2">
          <Bell size={18} className="text-aurora-green" />
          Your Alert Thresholds
        </h3>
        <ThresholdSettingsDialog
          onAdd={onAdd}
          onEdit={onEdit}
          editThreshold={editingThreshold}
          onCloseEdit={() => setEditingThreshold(null)}
        />
      </div>

      {thresholds.length === 0 ? (
        <Card className="border-none bg-deep-indigo">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-faint-star">
              No alert thresholds set. Click “Add Alert” to create one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {thresholds.map((t) => (
            <Card
              key={t.id}
              className="border-none bg-deep-indigo/60 hover:bg-deep-indigo transition-colors"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <span className="text-sm font-medium text-starlight">
                    {t.label || `${t.parameter} ${t.operator} ${t.value}`}
                  </span>
                  {t.label && (
                    <span className="ml-2 text-xs text-faint-star">
                      ({t.parameter} {t.operator} {t.value})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingThreshold(t)}
                    className="h-8 w-8 text-faint-star hover:text-starlight hover:bg-void-navy"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(t.id)}
                    className="h-8 w-8 text-faint-star hover:text-solar-amber hover:bg-void-navy"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
