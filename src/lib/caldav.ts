import { DAVClient } from "tsdav";

export interface CalendarEventData {
  id: string;
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
  reason?: string;
  appointmentDate?: string;
  notes?: string;
  summary?: string;
}

const MONTH_MAP: Record<string, number> = {
  januar: 0, februar: 1, "märz": 2, april: 3, mai: 4, juni: 5,
  juli: 6, august: 7, september: 8, oktober: 9, november: 10, dezember: 11,
  jan: 0, feb: 1, mär: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dez: 11,
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const s = dateStr.trim();

  // 1) DD.MM.YYYY HH:mm
  const fmt1 = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (fmt1) {
    return new Date(Number(fmt1[3]), Number(fmt1[2]) - 1, Number(fmt1[1]), Number(fmt1[4]), Number(fmt1[5]));
  }

  // 2) "24. April, 13:00" or "24. April 2026, 13:00 Uhr" (with optional weekday prefix)
  const fmt2 = s.match(/(\d{1,2})\.\s*([A-Za-zäöü]+)\.?\s*(\d{4})?\s*,?\s*(\d{1,2}):(\d{2})/i);
  if (fmt2) {
    const day = Number(fmt2[1]);
    const monthName = fmt2[2].toLowerCase();
    const month = MONTH_MAP[monthName];
    const year = fmt2[3] ? Number(fmt2[3]) : new Date().getFullYear();
    const hour = Number(fmt2[4]);
    const minute = Number(fmt2[5]);
    if (month !== undefined) {
      return new Date(year, month, day, hour, minute);
    }
  }

  // 3) "Donnerstag, 24. April" without time → default 9:00
  const fmt3 = s.match(/(\d{1,2})\.\s*([A-Za-zäöü]+)\.?\s*(\d{4})?/i);
  if (fmt3) {
    const day = Number(fmt3[1]);
    const monthName = fmt3[2].toLowerCase();
    const month = MONTH_MAP[monthName];
    const year = fmt3[3] ? Number(fmt3[3]) : new Date().getFullYear();
    if (month !== undefined) {
      // Extract time if present elsewhere in string
      const timeMatch = s.match(/(\d{1,2}):(\d{2})/);
      const hour = timeMatch ? Number(timeMatch[1]) : 9;
      const minute = timeMatch ? Number(timeMatch[2]) : 0;
      return new Date(year, month, day, hour, minute);
    }
  }

  // 4) ISO / native Date parse
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function extractFromSummary(summary: string): { name?: string; reason?: string; date?: string; phone?: string } {
  const result: { name?: string; reason?: string; date?: string; phone?: string } = {};

  // Extract name: **Anrufer:** Herr Scham
  const nameMatch = summary.match(/\*\*Anrufer:\*\*\s*(.+)/i);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    if (name && name.toLowerCase() !== "unbekannt") {
      result.name = name;
    }
  }

  // Extract reason: **Anliegen:** ...
  const reasonMatch = summary.match(/\*\*Anliegen:\*\*\s*(.+)/i);
  if (reasonMatch) {
    result.reason = reasonMatch[1].trim();
  }

  // Extract appointment: **Termin/Reservierung:** Donnerstag, 24. April, 13:00 Uhr, Zahnreinigung
  const appointmentMatch = summary.match(/\*\*Termin\/Reservierung:\*\*\s*(.+)/i);
  if (appointmentMatch) {
    const val = appointmentMatch[1].trim();
    if (val.toLowerCase() !== "kein termin" && val !== "-") {
      result.date = val;
    }
  }

  // Extract phone: **Telefonnummer:** ...
  const phoneMatch = summary.match(/\*\*Telefonnummer:\*\*\s*(.+)/i);
  if (phoneMatch) {
    const phone = phoneMatch[1].trim();
    if (phone.toLowerCase() !== "unbekannt" && phone !== "-") {
      result.phone = phone;
    }
  }

  return result;
}

function generateICS(data: CalendarEventData): string {
  // Use summary as fallback for missing fields
  const fromSummary = data.summary ? extractFromSummary(data.summary) : {};

  const callerName = data.callerName || fromSummary.name || "Kunde";
  const reason = data.reason || fromSummary.reason || "Termin";
  const dateStr = data.appointmentDate || fromSummary.date || "";
  const callerPhone = data.callerPhone || fromSummary.phone;

  const uid = `${data.id}@clickfabrik.ch`;
  const summary = `Termin: ${callerName} – ${reason}`;

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  let dtstart: string;
  let dtend: string;

  const parsedDate = dateStr ? parseDate(dateStr) : null;
  if (parsedDate) {
    dtstart = fmt(parsedDate);
    dtend = fmt(new Date(parsedDate.getTime() + 60 * 60 * 1000));
  } else {
    const now = new Date();
    dtstart = fmt(now);
    dtend = fmt(new Date(now.getTime() + 60 * 60 * 1000));
  }

  const descriptionParts = [
    `Kunde: ${callerName}`,
    callerPhone && `Telefon: ${callerPhone}`,
    data.callerEmail && `E-Mail: ${data.callerEmail}`,
    `Anliegen: ${reason}`,
    data.notes && `Notizen: ${data.notes}`,
  ].filter(Boolean);

  const description = descriptionParts.join("\\n");

  console.log(`[CalDAV] Creating event: name="${callerName}", reason="${reason}", date="${dateStr}", parsed=${parsedDate?.toISOString() || "null"}`);

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
