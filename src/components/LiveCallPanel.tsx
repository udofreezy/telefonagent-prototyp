"use client";

import { useState, useEffect, useCallback } from "react";
import { CallStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Phone,
  PhoneOff,
  User,
  FileText,
  CalendarCheck,
  PhoneCall,
  AlertCircle,
  Clock,
  Check,
} from "lucide-react";

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function LiveCallPanel() {
  const [status, setStatus] = useState<CallStatus>({ active: false });
  const [dismissed, setDismissed] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/call-status");
      if (res.ok) {
        const data: CallStatus = await res.json();
        setStatus(data);
        if (data.active) {
          setDismissed(null);
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleDismiss = async () => {
    setDismissed(status.callId || "dismissed");
    await fetch("/api/call-status", { method: "POST" });
  };

  // Active call
  if (status.active) {
    return (
      <div className="glow-green rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Phone className="h-5 w-5" />
            </div>
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div>
            <p className="font-semibold text-emerald-400">Anruf im Gange...</p>
            {status.phoneNumber && (
              <p className="text-sm text-emerald-400/70">{status.phoneNumber}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Latest call summary (not dismissed)
  const call = status.latestCall;
  if (call && status.callId !== dismissed) {
    const data = call.structuredData;

    return (
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneOff className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Letzter Anruf</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="rounded-lg text-xs h-7">
            <Check className="mr-1 h-3 w-3" />
            Gelesen
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          {data?.callerName && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0 text-[#c9a96e]" />
              <span className="font-medium">{data.callerName}</span>
              {call.phoneNumber && (
                <span className="text-xs text-muted-foreground">({call.phoneNumber})</span>
              )}
            </div>
          )}
          {!data?.callerName && call.phoneNumber && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0 text-[#c9a96e]" />
              <span className="font-medium">{call.phoneNumber}</span>
            </div>
          )}
          {data?.reason && (
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">{data.reason}</span>
            </div>
          )}
          {data?.appointmentRequested && (
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="font-medium text-emerald-400">
                Termin: {data.appointmentDate || "Ja"}
              </span>
            </div>
          )}
          {data?.callbackRequested && (
            <div className="flex items-center gap-2">
              <PhoneCall className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              <span className="font-medium text-blue-400">Rückruf gewünscht</span>
            </div>
          )}
          {data?.urgency && data.urgency.toLowerCase() !== "niedrig" && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#c9a96e]" />
              <span className="font-medium text-[#c9a96e]">Dringlichkeit: {data.urgency}</span>
            </div>
          )}
          {call.duration && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Dauer: {formatDuration(call.duration)}</span>
            </div>
          )}
        </div>
        {call.summary && (
          <div className="mt-3 rounded-xl bg-background/50 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Zusammenfassung
            </p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
              {call.summary}
            </p>
          </div>
        )}
        {data?.notes && (
          <div className="mt-2 rounded-lg border border-dashed border-border/50 p-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Notiz:</span> {data.notes}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Idle state
  return (
    <div className="rounded-2xl border border-dashed border-border/50 bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <Phone className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Bereit</p>
          <p className="text-xs text-muted-foreground/60">Warte auf Anrufe...</p>
        </div>
      </div>
    </div>
  );
}
