import { DAVClient } from "tsdav";
import { Appointment } from "@/types";

function generateICS(appointment: Appointment): string {
  const uid = `${appointment.id}@clickfabrik.ch`;
  const summary = `Termin: ${appointment.callerName || "Kunde"} – ${appointment.reason || "Termin"}`;

  let dtstart: string;
  let dtend: string;

  if (appointment.appointmentDate) {
    try {
      const start = new Date(appointment.appointmentDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const fmt = (d: Date) =>
          d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
        dtstart = fmt(start);
        dtend = fmt(end);
      } else {
        // Fallback: now + 1h
        const now = new Date();
        const later = new Date(now.getTime() + 60 * 60 * 1000);
        const fmt = (d: Date) =>
          d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
        dtstart = fmt(now);
        dtend = fmt(later);
      }
    } catch {
      const now = new Date();
      const later = new Date(now.getTime() + 60 * 60 * 1000);
      const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      dtstart = fmt(now);
      dtend = fmt(later);
    }
  } else {
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    dtstart = fmt(now);
    dtend = fmt(later);
  }

  const descriptionParts = [
    appointment.callerName && `Kunde: ${appointment.callerName}`,
    appointment.callerPhone && `Telefon: ${appointment.callerPhone}`,
    appointment.callerEmail && `E-Mail: ${appointment.callerEmail}`,
    appointment.reason && `Anliegen: ${appointment.reason}`,
    appointment.notes && `Notizen: ${appointment.notes}`,
  ].filter(Boolean);

  const description = descriptionParts.join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Clickfabrik//Telefonagent//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function createCalendarEvent(appointment: Appointment): Promise<void> {
  const serverUrl = process.env.CALDAV_URL;
  const calendarUrl = process.env.CALDAV_CALENDAR_URL;
  const username = process.env.CALDAV_USERNAME;
  const password = process.env.CALDAV_PASSWORD;

  if (!serverUrl || !username || !password) {
    throw new Error("CalDAV-Konfiguration fehlt (CALDAV_URL, CALDAV_USERNAME, CALDAV_PASSWORD).");
  }

  const client = new DAVClient({
    serverUrl,
    credentials: { username, password },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  await client.login();

  let calendar;

  if (calendarUrl) {
    // Use the specific calendar URL from env
    const calendars = await client.fetchCalendars();
    calendar = calendars.find((c) => c.url === calendarUrl || c.url.includes(calendarUrl));
    if (!calendar) {
      // Fallback: use the URL directly as calendar object
      calendar = { url: calendarUrl };
    }
  } else {
    // Fallback: use first available calendar
    const calendars = await client.fetchCalendars();
    if (calendars.length === 0) {
      throw new Error("Kein Kalender gefunden.");
    }
    calendar = calendars[0];
  }

  const iCalString = generateICS(appointment);
  const filename = `${appointment.id}.ics`;

  const result = await client.createCalendarObject({
    calendar,
    filename,
    iCalString,
  });

  if (!result.ok) {
    throw new Error(`CalDAV-Fehler: ${result.status} ${result.statusText}`);
  }
}
