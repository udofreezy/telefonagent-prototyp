"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Appointment, Customer } from "@/types";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Phone,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CalendarPlus,
  Ban,
  Loader2,
  AlertTriangle,
  Shield,
  X,
} from "lucide-react";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function parseAppointmentDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return "Nicht angegeben";
  try {
    return new Date(dateStr).toLocaleString("de-CH", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Fill leading nulls
  for (let i = 0; i < startWeekday; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill trailing nulls
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function statusColor(status: string) {
  switch (status) {
    case "pending": return { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-500", border: "border-amber-500/30" };
    case "confirmed": return { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500/30" };
    case "rejected": return { bg: "bg-red-500/15", text: "text-red-400/60", dot: "bg-red-500/50", border: "border-red-500/20" };
    default: return { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", border: "border-border" };
  }
}

interface AppointmentPopoverProps {
  appointment: Appointment;
  customer: Customer | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  confirming: boolean;
}

function AppointmentPopover({ appointment, customer, onClose, onConfirm, onReject, confirming }: AppointmentPopoverProps) {
  const colors = statusColor(appointment.status);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div ref={popoverRef} className={`w-full max-w-md rounded-2xl border ${colors.border} bg-card shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}>
              <CalendarDays className={`h-4 w-4 ${colors.text}`} />
            </div>
            <div>
              <p className="font-semibold">{appointment.callerName || "Unbekannter Anrufer"}</p>
              <span className={`inline-flex items-center gap-1 rounded-md ${colors.bg} px-2 py-0.5 text-xs font-medium ${colors.text}`}>
                {appointment.status === "pending" && <><AlertCircle className="h-3 w-3" /> Offen</>}
                {appointment.status === "confirmed" && <><CheckCircle2 className="h-3 w-3" /> Bestätigt</>}
                {appointment.status === "rejected" && <><XCircle className="h-3 w-3" /> Abgelehnt</>}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <Clock className="h-4 w-4 text-[#0693e3] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Termin</p>
              <p className={`text-sm font-semibold ${appointment.appointmentDate ? "text-foreground" : "text-red-400"}`}>
                {formatFullDate(appointment.appointmentDate)}
              </p>
            </div>
          </div>

          {appointment.reason && (
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
              <MessageSquare className="h-4 w-4 text-[#0693e3] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Anliegen</p>
                <p className="text-sm font-medium">{appointment.reason}</p>
              </div>
            </div>
          )}

          {appointment.callerPhone && (
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Telefon</p>
                <p className="text-sm font-medium">{appointment.callerPhone}</p>
              </div>
            </div>
          )}

          {customer && (
            <div className="rounded-lg border border-[#0693e3]/20 bg-[#0693e3]/5 px-3 py-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#0693e3]" />
                <p className="text-sm font-semibold text-[#0693e3]">
                  Bekannter Patient: {customer.name} ({customer.patientenNr})
                </p>
              </div>
              {customer.insuranceType && (
                <div className="flex items-center gap-2 ml-6">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Versicherung: {customer.insuranceType}</p>
                </div>
              )}
              {customer.allergies && (
                <div className="flex items-center gap-2 ml-6">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <p className="text-xs font-medium text-amber-500">Allergie: {customer.allergies}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {appointment.status === "pending" && (
          <div className="flex gap-2 border-t border-border/50 px-5 py-4">
            <Button
              className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onConfirm(appointment.id)}
              disabled={confirming}
            >
              {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
              {confirming ? "Wird eingetragen..." : "Bestätigen & Eintragen"}
            </Button>
            <Button
              variant="outline"
              className="rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => onReject(appointment.id)}
              disabled={confirming}
            >
              <Ban className="mr-2 h-4 w-4" />
              Ablehnen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CalendarView() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [aptRes, custRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/customers"),
      ]);
      if (aptRes.ok) {
        const data = await aptRes.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      const patchRes = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "confirmed" }),
      });
      if (!patchRes.ok) throw new Error("Fehler beim Bestätigen.");

      const calRes = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id }),
      });
      if (!calRes.ok) {
        const data = await calRes.json().catch(() => ({}));
        throw new Error(data.error || "Fehler beim Kalender-Eintrag.");
      }

      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "confirmed" as const } : a)));
      setSelectedAppointment((prev) => prev && prev.id === id ? { ...prev, status: "confirmed" as const } : prev);
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

      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a)));
      setSelectedAppointment((prev) => prev && prev.id === id ? { ...prev, status: "rejected" as const } : prev);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler beim Ablehnen.");
    }
  };

  const weeks = getMonthGrid(currentYear, currentMonth);
  const visible = appointments.filter((a) => a.status !== "deleted");

  function getAppointmentsForDay(date: Date): Appointment[] {
    return visible.filter((a) => {
      const d = parseAppointmentDate(a.appointmentDate);
      return d && isSameDay(d, date);
    });
  }

  function getCustomerForAppointment(apt: Appointment): Customer | null {
    if (apt.customerId) return customers.find((c) => c.id === apt.customerId) || null;
    return null;
  }

  const pending = visible.filter((a) => a.status === "pending").length;
  const confirmed = visible.filter((a) => a.status === "confirmed").length;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Offen: <span className="font-semibold text-foreground">{pending}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Bestätigt: <span className="font-semibold text-foreground">{confirmed}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
          <span className="text-muted-foreground">Abgelehnt: <span className="font-semibold text-foreground">{visible.length - pending - confirmed}</span></span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold min-w-[200px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={goToday}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Heute
        </Button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-[#0693e3]/20" />
            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-[#0693e3]" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Kalender wird geladen...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-7 border-b border-border/50">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-border/30 last:border-b-0">
              {week.map((date, di) => {
                if (!date) {
                  return <div key={di} className="min-h-[100px] bg-muted/20 p-1.5" />;
                }

                const isToday = isSameDay(date, today);
                const dayAppointments = getAppointmentsForDay(date);
                const isWeekend = di >= 5;

                return (
                  <div
                    key={di}
                    className={`min-h-[100px] p-1.5 transition-colors ${
                      isToday ? "ring-2 ring-inset ring-[#0693e3] bg-[#0693e3]/5" : ""
                    } ${isWeekend && !isToday ? "bg-muted/10" : ""}`}
                  >
                    <div className={`mb-1 text-right text-xs font-medium ${
                      isToday ? "text-[#0693e3] font-bold" : "text-muted-foreground"
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 3).map((apt) => {
                        const colors = statusColor(apt.status);
                        const time = parseAppointmentDate(apt.appointmentDate);
                        return (
                          <button
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`w-full rounded-md ${colors.bg} px-1.5 py-0.5 text-left text-[10px] font-medium ${colors.text} truncate hover:opacity-80 transition-opacity cursor-pointer`}
                          >
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors.dot} mr-1`} />
                            {time ? formatTime(time) + " " : ""}
                            {apt.callerName?.split(" ")[0] || "???"}
                          </button>
                        );
                      })}
                      {dayAppointments.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          +{dayAppointments.length - 3} mehr
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Detail popover */}
      {selectedAppointment && (
        <AppointmentPopover
          appointment={selectedAppointment}
          customer={getCustomerForAppointment(selectedAppointment)}
          onClose={() => setSelectedAppointment(null)}
          onConfirm={handleConfirm}
          onReject={handleReject}
          confirming={confirmingId === selectedAppointment.id}
        />
      )}
    </div>
  );
}
