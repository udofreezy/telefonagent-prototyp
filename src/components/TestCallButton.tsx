"use client";

import { Phone, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface Props {
  phoneNumber?: string;
  assistantId?: string;
}

export function TestCallButton({ phoneNumber, assistantId }: Props) {
  const [copied, setCopied] = useState(false);

  if (!assistantId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Phone className="mb-3 h-10 w-10" />
          <p className="text-sm">
            Erstellen Sie zuerst einen Agenten, um die Testnummer zu sehen.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayNumber = phoneNumber || "Nummer wird geladen...";

  const handleCopy = async () => {
    if (phoneNumber) {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Phone className="h-5 w-5 text-primary" />
          Jetzt testen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            Rufen Sie diese Nummer an:
          </p>
          <p className="text-3xl font-bold tracking-wider">{displayNumber}</p>
        </div>
        {phoneNumber && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Kopiert!" : "Nummer kopieren"}
            </Button>
            <Button size="sm" asChild>
              <a href={`tel:${phoneNumber}`}>
                <Phone className="mr-2 h-4 w-4" />
                Anrufen
              </a>
            </Button>
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground">
          Agent-ID: {assistantId}
        </p>
      </CardContent>
    </Card>
  );
}
