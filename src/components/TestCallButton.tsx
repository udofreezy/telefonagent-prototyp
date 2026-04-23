"use client";

import { Phone, Copy, Check, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props {
  phoneNumber?: string;
  assistantId?: string;
}

export function TestCallButton({ phoneNumber, assistantId }: Props) {
  const [copied, setCopied] = useState(false);

  if (!assistantId) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Phone className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">Testnummer</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Erstellen Sie zuerst einen Agenten.
          </p>
        </div>
      </div>
    );
  }

  const displayNumber = phoneNumber || "Wird geladen...";

  const handleCopy = async () => {
    if (phoneNumber) {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glow-teal rounded-2xl border border-[#1f90b2]/20 bg-gradient-to-b from-[#1f90b2]/5 to-transparent p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f90b2] text-white">
          <PhoneCall className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">Jetzt testen</h3>
      </div>
      <div className="text-center">
        <p className="mb-2 text-xs text-muted-foreground">Rufen Sie diese Nummer an:</p>
        <p className="text-2xl font-bold tracking-wider gradient-text">{displayNumber}</p>
      </div>
      {phoneNumber && (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="rounded-xl text-xs"
          >
            {copied ? (
              <Check className="mr-1.5 h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="mr-1.5 h-3 w-3" />
            )}
            {copied ? "Kopiert!" : "Kopieren"}
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-[#1f90b2] text-white hover:bg-[#17798f] border-0 text-xs"
            render={<a href={`tel:${phoneNumber}`} />}
          >
            <Phone className="mr-1.5 h-3 w-3" />
            Anrufen
          </Button>
        </div>
      )}
      <p className="mt-3 text-center text-[10px] text-muted-foreground/60">
        ID: {assistantId}
      </p>
    </div>
  );
}
