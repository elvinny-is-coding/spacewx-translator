"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, PlusCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Threshold,
  ThresholdParameter,
  ThresholdOperator,
} from "@/types/threshold";
import { validateThreshold } from "@/lib/thresholds";
import { THRESHOLD_PRESETS, PresetThreshold } from "@/lib/threshold-presets";

interface ThresholdSettingsDialogProps {
  onAdd: (
    parameter: Threshold["parameter"],
    operator: Threshold["operator"],
    value: number,
    label?: string,
  ) => void;
  onEdit?: (id: string, updates: Partial<Threshold>) => void;
  /** If provided, dialog opens in edit mode pre‑filled with this threshold. */
  editThreshold?: Threshold | null;
  /** Called when edit is cancelled or completed. */
  onCloseEdit?: () => void;
}

const PARAMETERS: { value: ThresholdParameter; label: string }[] = [
  { value: "kp", label: "Kp Index" },
  { value: "solarWindSpeed", label: "Solar Wind Speed (km/s)" },
  { value: "solarWindBz", label: "Bz (nT)" },
];

const OPERATORS: { value: ThresholdOperator; label: string }[] = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: "≥" },
  { value: "<=", label: "≤" },
  { value: "=", label: "=" },
];

export default function ThresholdSettingsDialog({
  onAdd,
  onEdit,
  editThreshold,
  onCloseEdit,
}: ThresholdSettingsDialogProps) {
  const isEdit = !!editThreshold;
  const [open, setOpen] = useState(false);
  const [parameter, setParameter] = useState<ThresholdParameter>("kp");
  const [operator, setOperator] = useState<ThresholdOperator>(">");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(
    null,
  );

  // Reset form when opening / closing
  useEffect(() => {
    if (open) {
      if (editThreshold) {
        setParameter(editThreshold.parameter);
        setOperator(editThreshold.operator);
        setValue(String(editThreshold.value));
        setLabel(editThreshold.label ?? "");
      } else {
        setParameter("kp");
        setOperator(">");
        setValue("");
        setLabel("");
      }
      setError(null);
      setSelectedPresetIndex(null);
    }
  }, [open, editThreshold]);

  // Open / close controlled by external state or trigger
  useEffect(() => {
    if (editThreshold) setOpen(true);
  }, [editThreshold]);

  const handleClose = () => {
    setOpen(false);
    onCloseEdit?.();
  };

  const applyPreset = (preset: PresetThreshold) => {
    setParameter(preset.parameter);
    setOperator(preset.operator);
    setValue(String(preset.value));
    setLabel(preset.label);
    setSelectedPresetIndex(THRESHOLD_PRESETS.indexOf(preset));
    setError(null);
  };

  const handleSubmit = () => {
    const numVal = parseFloat(value);
    if (!value || !Number.isFinite(numVal)) {
      setError("Please enter a valid number.");
      return;
    }
    const tempThreshold: Threshold = {
      id: editThreshold?.id ?? "temp",
      parameter,
      operator,
      value: numVal,
      label: label.trim() || undefined,
    };
    const validationError = validateThreshold(tempThreshold);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isEdit && onEdit && editThreshold) {
      onEdit(editThreshold.id, {
        parameter,
        operator,
        value: numVal,
        label: label.trim() || undefined,
      });
    } else {
      onAdd(parameter, operator, numVal, label.trim() || undefined);
    }

    setOpen(false);
    onCloseEdit?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onCloseEdit?.();
      }}
    >
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight",
        )}
      >
        <PlusCircle size={16} className="mr-2" />
        Add Alert
      </DialogTrigger>
      <DialogContent className="bg-deep-indigo text-starlight border-void-navy sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-starlight">
            {isEdit ? "Edit Threshold" : "Add Alert Threshold"}
          </DialogTitle>
          <DialogDescription className="text-faint-star">
            {isEdit
              ? "Modify the threshold conditions."
              : "Get notified when a space weather condition crosses your set threshold."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Presets ── */}
        {!isEdit && (
          <div className="space-y-2">
            <Label className="text-sm text-faint-star flex items-center gap-1">
              <Sparkles size={14} /> Quick Presets
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-auto">
              {THRESHOLD_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "text-left p-2 rounded-lg border text-xs transition-colors",
                    selectedPresetIndex === idx
                      ? "border-aurora-green bg-aurora-green/10 text-starlight"
                      : "border-void-navy bg-void-navy/50 text-faint-star hover:border-aurora-green/50",
                  )}
                >
                  <span className="font-semibold block">{preset.label}</span>
                  <span className="text-[10px] text-faint-star leading-tight line-clamp-2">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parameter" className="text-right text-faint-star">
              Parameter
            </Label>
            <Select
              value={parameter}
              onValueChange={(val) => setParameter(val as ThresholdParameter)}
            >
              <SelectTrigger className="col-span-3 bg-void-navy border-void-navy text-starlight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-deep-indigo border-void-navy text-starlight">
                {PARAMETERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="operator" className="text-right text-faint-star">
              Operator
            </Label>
            <Select
              value={operator}
              onValueChange={(val) => setOperator(val as ThresholdOperator)}
            >
              <SelectTrigger className="col-span-3 bg-void-navy border-void-navy text-starlight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-deep-indigo border-void-navy text-starlight">
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right text-faint-star">
              Value
            </Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="e.g., 5"
              className="col-span-3 bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right text-faint-star">
              Label
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional"
              className="col-span-3 bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green"
            />
          </div>

          {error && (
            <p className="text-sm text-solar-amber col-start-2 col-span-3">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-aurora-green text-void-navy hover:bg-aurora-green/90"
          >
            {isEdit ? "Save Changes" : "Add Threshold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
