"use client";

import { useState, useEffect } from "react";
import { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  CalendarCheck,
  Trash2,
  Phone,
  Mail,
  Clock,
  FileText,
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  XCircle,
  Ban,
  Loader2,
} from "lucide-react";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Nicht angegeben";
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
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
          <AlertCircle className="h-3 w-3" />
          Offen
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Bestätigt
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
          <XCircle className="h-3 w-3" />
          Abgelehnt
        </span>
      );
    default:
      return null;
  }
}

function AppointmentCard({
  appointment,
  onConfirm,
  onReject,
  onDelete,
  confirmingId,
}: {
  appointment: Appointment;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  confirmingId: string | null;
}) {
  const isRejected = appointment.status === "rejected";
  const isConfirming = confirmingId === appointment.id;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isRejected
          ? "border-border/30 bg-card/50 opacity-60"
          : appointment.status === "pending"
            ? "border-amber-500/20 bg-card card-hover"
            : "border-emerald-500/20 bg-card card-hover"
      }`}
    >
      <div className="p-4">
        {/* Compact header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isRejected
                  ? "bg-muted text-muted-foreground"
                  : appointment.status === "pending"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`font-semibold truncate ${isRejected ? "line-through text-muted-foreground" : ""}`}>
                  {appointment.callerName || "Unbekannter Anrufer"}
                </p>
                {statusBadge(appointment.status)}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {appointment.callerPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <a href={`tel:${appointment.callerPhone}`} className="hover:text-[#ff6b35] transition-colors">
                      {appointment.callerPhone}
                    </a>
                  </span>
                )}
                {appointment.reason && (
                  <span className={`truncate max-w-[200px] ${isRejected ? "line-through" : ""}`}>
                    {appointment.reason}
                  </span>
                )}
                {appointment.appointmentDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {appointment.appointmentDate}
                  </span>
                )}
                <span className="text-muted-foreground/60">
                  {formatDate(appointment.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            {appointment.status === "pending" && (
              <>
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  onClick={() => onConfirm(appointment.id)}
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isConfirming ? "Wird eingetragen..." : "Eintragen"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-400 text-xs"
                  onClick={() => onReject(appointment.id)}
                  disabled={isConfirming}
                >
                  <Ban className="mr-1.5 h-3.5 w-3.5" />
                  Ablehnen
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(appointment.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Extra details row for email/notes (only if present and not rejected) */}
        {!isRejected && (appointment.callerEmail || appointment.notes) && (
          <div className="mt-2 ml-12 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {appointment.callerEmail && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <a href={`mailto:${appointment.callerEmail}`} className="hover:text-[#ff6b35] transition-colors">
                  {appointment.callerEmail}
                </a>
              </span>
            )}
            {appointment.notes && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {appointment.notes}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments");
      if (!res.ok) throw new Error("Fehler beim Laden.");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Fehler beim Laden der Termine."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      // 1. Status auf confirmed setzen
      const patchRes = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "confirmed" }),
      });
      if (!patchRes.ok) throw new Error("Fehler beim Bestätigen.");

      // 2. In den Kalender eintragen via CalDAV
      const calRes = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id }),
      });

      if (!calRes.ok) {
        const data = await calRes.json().catch(() => ({}));
        throw new Error(data.error || "Fehler beim Kalender-Eintrag.");
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "confirmed" as const } : a))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler beim Eintragen.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "rejected" }),
      });
      if (!res.ok) throw new Error("Fehler beim Ablehnen.");

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler beim Ablehnen.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Termin wirklich löschen?")) return;

    try {
      const res = await fetch(`/api/appointments?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Löschen.");
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler beim Löschen.");
    }
  };

  const visible = appointments.filter((a) => a.status !== "deleted");
  const pending = visible.filter((a) => a.status === "pending");
  const confirmed = visible.filter((a) => a.status === "confirmed");
  const rejected = visible.filter((a) => a.status === "rejected");

  // Sort: pending first, then confirmed, then rejected
  const sorted = [...pending, ...confirmed, ...rejected];

  return (
    <div className="space-y-6">
      {/* Stats */}
      {visible.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-xs text-muted-foreground">Offen</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{confirmed.length}</p>
                <p className="text-xs text-muted-foreground">Bestätigt</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejected.length}</p>
                <p className="text-xs text-muted-foreground">Abgelehnt</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b35]/10">
                <Calendar className="h-5 w-5 text-[#ff6b35]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visible.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Terminliste</h2>
          <p className="text-sm text-muted-foreground">
            Alle Anrufe als Termineinträge. Bestätigen, ablehnen oder löschen Sie Einträge.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAppointments}
          disabled={loading}
          className="rounded-xl"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Aktualisieren
        </Button>
      </div>

      {/* List */}
      {loading && appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-[#ff6b35]/20" />
            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-[#ff6b35]" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Termine werden geladen...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <CalendarCheck className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">Noch keine Termine</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Termine werden automatisch aus jedem Anruf erstellt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onConfirm={handleConfirm}
              onReject={handleReject}
              onDelete={handleDelete}
              confirmingId={confirmingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
