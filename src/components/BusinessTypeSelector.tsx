"use client";

import { BusinessType } from "@/types";
import { businessTemplates } from "@/lib/templates";
import { Label } from "@/components/ui/label";
import {
  Stethoscope,
  UtensilsCrossed,
  SprayCan,
  Gem,
  Building2,
  Smile,
} from "lucide-react";

const icons: Record<BusinessType, React.ElementType> = {
  physiotherapie: Stethoscope,
  zahnarzt: Smile,
  restaurant: UtensilsCrossed,
  reinigung: SprayCan,
  juwelier: Gem,
  allgemein: Building2,
};

interface Props {
  value: BusinessType;
  onChange: (value: BusinessType) => void;
}

export function BusinessTypeSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Branche</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.values(businessTemplates).map((template) => {
          const Icon = icons[template.id];
          const isActive = value === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onChange(template.id)}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 ${
                isActive
                  ? "border-[#1f90b2] bg-[#1f90b2]/5 shadow-md shadow-[#1f90b2]/10"
                  : "border-border/50 bg-background/30 hover:border-border hover:bg-background/50"
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-[#1f90b2] text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-sm font-medium ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}>
                {template.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
