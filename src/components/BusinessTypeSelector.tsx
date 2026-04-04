"use client";

import { BusinessType } from "@/types";
import { businessTemplates } from "@/lib/templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="space-y-2">
      <Label htmlFor="businessType">Branche</Label>
      <Select value={value} onValueChange={(v) => onChange(v as BusinessType)}>
        <SelectTrigger id="businessType" className="w-full">
          <SelectValue placeholder="Branche auswählen..." />
        </SelectTrigger>
        <SelectContent>
          {Object.values(businessTemplates).map((template) => {
            const Icon = icons[template.id];
            return (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{template.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
