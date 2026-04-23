import { DAVClient } from "tsdav";

export interface CalendarEventData {
  id: string;
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
  reason?: string;
  appointmentDate?: string;
  notes?: string;
}

function parseDate(dateStr: string): Date | null {
  // Try DD.MM.YYYY HH:mm format first
  const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  }
  // Fallback: try native Date parsing
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function generateICS(data: CalendarEventData): string {
  const uid = `${data.id}@clickfabrik.ch`;
  const summary = `Termin: ${data.callerName || "Kunde"} – ${data.reason || "Termin"}`;

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  let dtstart: string;
  let dtend: string;

  if (data.appointmentDate) {
    const start = parseDate(data.appointmentDate);
    if (start) {
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      dtstart = fmt(start);
      dtend = fmt(end);
    } else {
      const now = new Date();
      dtstart = fmt(now);
      dtend = fmt(new Date(now.getTime() + 60 * 60 * 1000));
    }
  } else {
    const now = new Date();
    dtstart = fmt(now);
    dtend = fmt(new Date(now.getTime() + 60 * 60 * 1000));
  }

  const descriptionParts = [
    data.callerName && `Kunde: ${data.callerName}`,
    data.callerPhone && `Telefon: ${data.callerPhone}`,
    data.callerEmail && `E-Mail: ${data.callerEmail}`,
    data.reason && `Anliegen: ${data.reason}`,
    data.notes && `Notizen: ${data.notes}`,
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
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function createCalendarEvent(data: CalendarEventData): Promise<void> {
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
    const calendars = await client.fetchCalendars();
    calendar = calendars.find((c) => c.url === calendarUrl || c.url.includes(calendarUrl));
    if (!calendar) {
      calendar = { url: calendarUrl };
    }
  } else {
    const calendars = await client.fetchCalendars();
    if (calendars.length === 0) {
      throw new Error("Kein Kalender gefunden.");
    }
    calendar = calendars[0];
  }

  const iCalString = generateICS(data);
  const filename = `${data.id}.ics`;

  const result = await client.createCalendarObject({
    calendar,
    filename,
    iCalString,
  });

  if (!result.ok) {
    throw new Error(`CalDAV-Fehler: ${result.status} ${result.statusText}`);
  }
}
