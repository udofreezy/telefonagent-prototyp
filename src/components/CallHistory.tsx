"use client";

import { useState, useEffect } from "react";
import { CallLog } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  PhoneOff,
  User,
  CalendarCheck,
  PhoneCall,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PhoneIncoming,
  Trash2,
  Mail,
} from "lucide-react";

function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")} min`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "ended":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <PhoneOff className="h-3 w-3" />
          Beendet
        </span>
      );
    case "in-progress":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Aktiv
        </span>
      );
    case "queued":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
          Wartend
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {status}
        </span>
      );
  }
}

function urgencyBadge(urgency?: string) {
  if (!urgency) return null;
  const u = urgency.toLowerCase();
  if (u.includes("hoch") || u === "high") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
        <AlertCircle className="h-3 w-3" />
        Dringend
      </span>
    );
  }
  if (u.includes("mittel") || u === "medium") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#ff6b35]/10 px-2 py-0.5 text-xs font-medium text-[#ff6b35]">
        Mittel
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
      {urgency}
    </span>
  );
}

function CallItem({ call }: { call: CallLog }) {
  const [expanded, setExpanded] = useState(false);
  const data = call.structuredData;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 card-hover ${
        expanded
          ? "border-[#ff6b35]/20 bg-card shadow-lg"
          : "border-border/50 bg-card hover:border-border"
      }`}
    >
      {/* Collapsed view: compact row with key info */}
      <div
        className="flex cursor-pointer items-center justify-between gap-3 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            call.status === "ended"
              ? "bg-muted text-muted-foreground"
              : "bg-emerald-500/10 text-emerald-500"
          }`}>
            {call.status === "ended" ? (
              <PhoneOff className="h-4 w-4" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">
                {data?.callerName || call.phoneNumber || "Unbekannte Nummer"}
              </p>
              {data?.callerName && call.phoneNumber && (
                <span className="text-xs text-muted-foreground">{call.phoneNumber}</span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {data?.reason && (
                <span className="truncate max-w-[250px] italic">{data.reason}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(call.startedAt)}
              </span>
              <span>{formatDuration(call.duration)}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {urgencyBadge(data?.urgency)}
          {statusBadge(call.status)}
          <div className={`ml-1 flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
            expanded ? "bg-[#ff6b35]/10 text-[#ff6b35]" : "text-muted-foreground"
          }`}>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded view: full details */}
      {expanded && (
        <div className="animate-fade-in-up space-y-4 border-t border-border/50 px-4 pb-4 pt-4">
          {/* Structured data details */}
          {data && (
            <div className="rounded-xl border border-border/50 bg-background/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Gesprächsnotiz
                </p>
                <div className="flex items-center gap-2">
                  {call.successEvaluation && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                        call.successEvaluation.toLowerCase().includes("pass") ||
                        call.successEvaluation.toLowerCase() === "true"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {call.successEvaluation.toLowerCase().includes("pass") ||
                      call.successEvaluation.toLowerCase() === "true" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {call.successEvaluation}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.callerName && (
                  <div className="flex items-start gap-2.5">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b35]" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Anrufer</p>
                      <p className="truncate text-sm font-medium">{data.callerName}</p>
                    </div>
                  </div>
                )}
                {data.callerPhone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b35]" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Telefon</p>
                      <p className="truncate text-sm font-medium">{data.callerPhone}</p>
                    </div>
                  </div>
                )}
                {data.callerEmail && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b35]" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">E-Mail</p>
                      <a href={`mailto:${data.callerEmail}`} className="truncate text-sm font-medium hover:text-[#ff6b35] transition-colors">
                        {data.callerEmail}
                      </a>
                    </div>
                  </div>
                )}
                {data.reason && (
                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b35]" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Anliegen</p>
                      <p className="text-sm">{data.reason}</p>
                    </div>
                  </div>
                )}
                {data.appointmentRequested && (
                  <div className="flex items-start gap-2.5">
                    <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Termin gewünscht</p>
                      <p className="text-sm font-medium">
                        {data.appointmentDate || "Ja (Details folgen)"}
                      </p>
                    </div>
                  </div>
                )}
                {data.callbackRequested && (
                  <div className="flex items-start gap-2.5">
                    <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rückruf erwünscht</p>
                      <p className="text-sm font-medium">Ja</p>
                    </div>
                  </div>
                )}
                {data.urgency && (
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Dringlichkeit</p>
                      <p className="text-sm font-medium">{data.urgency}</p>
                    </div>
                  </div>
                )}
                {data.notes && (
                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Notizen</p>
                      <p className="text-sm">{data.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {call.summary && (
            <div className="rounded-xl border border-border/50 bg-background/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Zusammenfassung
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{call.summary}</p>
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div className="rounded-xl border border-border/50 bg-background/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transkript
              </p>
              <ScrollArea className="h-48 rounded-lg bg-background/50 p-3">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono">
                  {call.transcript}
                </pre>
              </ScrollArea>
            </div>
          )}

          {/* Cost */}
          {call.cost !== undefined && (
            <p className="text-xs text-muted-foreground">
              Kosten: ${call.cost.toFixed(4)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CallHistory() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calls");
      if (!res.ok) throw new Error("Fehler beim Laden.");
      const data = await res.json();
      setCalls(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Anrufe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleClearCalls = async () => {
    if (!confirm("Anrufprotokoll wirklich leeren? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    try {
      const res = await fetch("/api/calls", { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Leeren.");
      setCalls([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler beim Leeren des Protokolls.");
    }
  };

  const totalCalls = calls.length;
  const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);
  const successRate = calls.length > 0
    ? Math.round(
        (calls.filter(c =>
          c.successEvaluation?.toLowerCase().includes("pass") ||
          c.successEvaluation?.toLowerCase() === "true"
        ).length / calls.length) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {calls.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b35]/10">
                <PhoneIncoming className="h-5 w-5 text-[#ff6b35]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCalls}</p>
                <p className="text-xs text-muted-foreground">Anrufe total</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
                <p className="text-xs text-muted-foreground">Gesamtdauer</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Erfolgsrate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Anrufverlauf</h2>
          <p className="text-sm text-muted-foreground">
            Alle eingehenden Anrufe mit Transkripten und Zusammenfassungen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {calls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCalls}
              className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Protokoll leeren
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCalls}
            disabled={loading}
            className="rounded-xl"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Call List */}
      {loading && calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-[#ff6b35]/20" />
            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-[#ff6b35]" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Anrufe werden geladen...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Phone className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">Noch keine Anrufe</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Erstellen Sie einen Agenten und rufen Sie die Testnummer an.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {calls.map((call) => (
            <CallItem key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}
