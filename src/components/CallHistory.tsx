"use client";

import { useState, useEffect } from "react";
import { CallLog } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Phone,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  PhoneOff,
} from "lucide-react";

function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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
      return <Badge variant="secondary">Beendet</Badge>;
    case "in-progress":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Aktiv
        </Badge>
      );
    case "queued":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Wartend
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function CallItem({ call }: { call: CallLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3 py-4">
      <div
        className="flex cursor-pointer items-start justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-muted p-2">
            {call.status === "ended" ? (
              <PhoneOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Phone className="h-4 w-4 text-green-600" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {call.phoneNumber || "Unbekannte Nummer"}
            </p>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(call.startedAt)}
              </span>
              <span>Dauer: {formatDuration(call.duration)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(call.status)}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="ml-11 space-y-3">
          {call.summary && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                Zusammenfassung
              </p>
              <p className="text-sm">{call.summary}</p>
            </div>
          )}
          {call.transcript && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                Transkript
              </p>
              <ScrollArea className="h-48 rounded-md border p-3">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                  {call.transcript}
                </pre>
              </ScrollArea>
            </div>
          )}
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Anrufverlauf</CardTitle>
            <CardDescription>
              Alle eingehenden Anrufe mit Transkripten und Zusammenfassungen.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCalls} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && calls.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Phone className="mb-3 h-10 w-10" />
            <p className="text-sm">
              Noch keine Anrufe vorhanden. Erstellen Sie einen Agenten und rufen
              Sie die Testnummer an.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {calls.map((call, i) => (
              <div key={call.id}>
                <CallItem call={call} />
                {i < calls.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
