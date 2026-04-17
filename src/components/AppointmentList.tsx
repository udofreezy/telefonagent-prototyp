"use client";

import { useState, useEffect } from "react";
import { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  CalendarCheck,
  Trash2,
  User,
  Phone,
  Mail,
  Clock,
  FileText,
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
  Calendar,
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

function buildGoogleCalendarUrl(appointment: Appointment): string {
  const title = encodeURIComponent(
    `Termin: ${appointment.callerName || "Kunde"} – ${appointment.reason || "Termin"}`
  );

  // Try to parse appointment date for start/end times
  let dates = "";
  if (appointment.appointmentDate) {
    try {
      const start = new Date(appointment.appointmentDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
        const fmt = (d: Date) =>
          d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
        dates = `&dates=${fmt(start)}/${fmt(end)}`;
      }
    } catch {
      // ignore parse errors
    }
  }

  const details = encodeURIComponent(
    [
      appointment.callerName && `Kunde: ${appointment.callerName}`,
      appointment.callerPhone && `Telefon: ${appointment.callerPhone}`,
      appointment.callerEmail && `E-Mail: ${appointment.callerEmail}`,
      appointment.reason && `Anliegen: ${appointment.reason}`,
      appointment.notes && `Notizen: ${appointment.notes}`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}${dates}&details=${details}`;
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
    default:
      return null;
  }
}

function AppointmentCard({
  appointment,
  onConfirm,
  onDelete,
}: {
  appointment: Appointment;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border transition-all duration-200 card-hover ${
        appointment.status === "pending"
          ? "border-amber-500/20 bg-card"
          : "border-emerald-500/20 bg-card"
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                appointment.status === "pending"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">
                {appointment.callerName || "Unbekannter Anrufer"}
              </p>
              <p className="text-xs text-muted-foreground">
                Erstellt: {formatDate(appointment.createdAt)}
              </p>
            </div>
          </div>
          {statusBadge(appointment.status)}
        </div>

        {/* Details Grid */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {appointment.callerPhone && (
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b35]" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Telefon
                </p>
                <a
                  href={`tel:${appointment.callerPhone}`}
                  className="text-sm font-medium hover:text-[#ff6b35] transition-colors"
                >
                  {appointment.callerPhone}
                </a>
              </div>
            </div>
          )}
          {appointment.callerEmail && (
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b35]" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  E-Mail
                </p>
                <a
                  href={`mailto:${appointment.callerEmail}`}
                  className="truncate text-sm font-medium hover:text-[#ff6b35] transition-colors"
                >
                  {appointment.callerEmail}
                </a>
              </div>
            </div>
          )}
          {appointment.appointmentDate && (
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b35]" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Gewünschter Termin
                </p>
                <p className="text-sm font-medium">{appointment.appointmentDate}</p>
              </div>
            </div>
          )}
          {appointment.reason && (
            <div className="flex items-start gap-2.5 sm:col-span-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b35]" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Anliegen
                </p>
                <p className="text-sm">{appointment.reason}</p>
              </div>
            </div>
          )}
          {appointment.notes && (
            <div className="flex items-start gap-2.5 sm:col-span-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Notizen
                </p>
                <p className="text-sm">{appointment.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-border/50 pt-4">
          {appointment.status === "pending" && (
            <Button
              size="sm"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onConfirm(appointment.id)}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Bestätigen & Kalender
            </Button>
          )}
          {appointment.status === "confirmed" && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                window.open(buildGoogleCalendarUrl(appointment), "_blank");
              }}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              In Kalender öffnen
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(appointment.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "confirmed" }),
      });
      if (!res.ok) throw new Error("Fehler beim Bestätigen.");

      // Open Google Calendar
      const appointment = appointments.find((a) => a.id === id);
      if (appointment) {
        window.open(buildGoogleCalendarUrl(appointment), "_blank");
      }

      // Update local state
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "confirmed" as const } : a))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler beim Bestätigen.");
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

  // Filter out deleted, show active ones
  const visible = appointments.filter((a) => a.status !== "deleted");
  const pending = visible.filter((a) => a.status === "pending");
  const confirmed = visible.filter((a) => a.status === "confirmed");

  return (
    <div className="space-y-6">
      {/* Stats */}
      {visible.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
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
            Alle Terminanfragen aus Anrufen. Bestätigen Sie Termine und tragen Sie
            sie in den Kalender ein.
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
            Termine werden automatisch aus Anrufen erstellt, wenn ein Termin
            angefragt wird.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending first, then confirmed */}
          {[...pending, ...confirmed].map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onConfirm={handleConfirm}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
