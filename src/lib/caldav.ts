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

  // 1) DD.MM.YYYY HH:mm (z.B. "04.05.2026 16:00")
  const fmt1 = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (fmt1) {
    return new Date(Number(fmt1[3]), Number(fmt1[2]) - 1, Number(fmt1[1]), Number(fmt1[4]), Number(fmt1[5]));
  }

  // 2) DD.MM.YYYY ohne Zeit (z.B. "04.05.2026") → default 9:00
  const fmt1b = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (fmt1b) {
    return new Date(Number(fmt1b[3]), Number(fmt1b[2]) - 1, Number(fmt1b[1]), 9, 0);
  }

  // 3) DD.MM. HH:mm ohne Jahr (z.B. "4.5. 16:00" oder "04.05. um 16:00")
  const fmt1c = s.match(/(\d{1,2})\.(\d{1,2})\.?\s*(?:um\s+)?(\d{1,2}):(\d{2})/);
  if (fmt1c) {
    const year = new Date().getFullYear();
    return new Date(year, Number(fmt1c[2]) - 1, Number(fmt1c[1]), Number(fmt1c[3]), Number(fmt1c[4]));
  }

  // 4) DD.MM. ohne Zeit und ohne Jahr (z.B. "4.5.") → default 9:00
  const fmt1d = s.match(/^(\d{1,2})\.(\d{1,2})\.?\s*$/);
  if (fmt1d) {
    const year = new Date().getFullYear();
    return new Date(year, Number(fmt1d[2]) - 1, Number(fmt1d[1]), 9, 0);
  }

  // 5) "24. April, 13:00" or "24. April 2026, 13:00 Uhr" (with optional weekday prefix)
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

  // 5b) "4. Mai, 16 Uhr" (ohne Minuten, mit "Uhr")
  const fmt2b = s.match(/(\d{1,2})\.\s*([A-Za-zäöü]+)\.?\s*(\d{4})?\s*,?\s*(?:um\s+)?(\d{1,2})\s*Uhr/i);
  if (fmt2b) {
    const day = Number(fmt2b[1]);
    const monthName = fmt2b[2].toLowerCase();
    const month = MONTH_MAP[monthName];
    const year = fmt2b[3] ? Number(fmt2b[3]) : new Date().getFullYear();
    const hour = Number(fmt2b[4]);
    if (month !== undefined) {
      return new Date(year, month, day, hour, 0);
    }
  }

  // 6) "Donnerstag, 24. April" with or without time
  const fmt3 = s.match(/(\d{1,2})\.\s*([A-Za-zäöü]+)\.?\s*(\d{4})?/i);
  if (fmt3) {
    const day = Number(fmt3[1]);
    const monthName = fmt3[2].toLowerCase();
    const month = MONTH_MAP[monthName];
    const year = fmt3[3] ? Number(fmt3[3]) : new Date().getFullYear();
    if (month !== undefined) {
      // Extract time: "HH:mm" or "HH Uhr"
      const timeMatch = s.match(/(\d{1,2}):(\d{2})/);
      const timeUhrMatch = s.match(/(\d{1,2})\s*Uhr/i);
      const hour = timeMatch ? Number(timeMatch[1]) : (timeUhrMatch ? Number(timeUhrMatch[1]) : 9);
      const minute = timeMatch ? Number(timeMatch[2]) : 0;
      return new Date(year, month, day, hour, minute);
    }
  }

  // 7) Nur Uhrzeit mit "Uhr" (z.B. "16 Uhr" oder "16:00 Uhr") → heute
  const timeOnly = s.match(/(\d{1,2})(?::(\d{2}))?\s*Uhr/i);
  if (timeOnly) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(timeOnly[1]), timeOnly[2] ? Number(timeOnly[2]) : 0);
  }

  // 8) ISO / native Date parse
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

  const uid = `${data.id}-${Date.now()}@clickfabrik.ch`;

  // Format date components directly as local time (no UTC conversion!)
  // The Date objects from parseDate contain the intended local time values.
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmtLocal = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  let dtstart: string;
  let dtend: string;

  const parsedDate = dateStr ? parseDate(dateStr) : null;
  let dateWarning = false;
  if (parsedDate) {
    dtstart = fmtLocal(parsedDate);
    dtend = fmtLocal(new Date(parsedDate.getTime() + 60 * 60 * 1000));
  } else {
    // Kein gültiges Datum – Fallback auf morgen 9:00 mit Warnung im Titel
    console.warn(`[CalDAV] WARNUNG: Datum konnte nicht geparst werden. Rohwert: "${dateStr || "leer"}". Verwende morgen 9:00 als Fallback.`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    dtstart = fmtLocal(tomorrow);
    dtend = fmtLocal(new Date(tomorrow.getTime() + 60 * 60 * 1000));
    dateWarning = true;
  }

  const summary = dateWarning
    ? `[DATUM PRÜFEN] Termin: ${callerName} – ${reason}`
    : `Termin: ${callerName} – ${reason}`;

  const descriptionParts = [
    `Kunde: ${callerName}`,
    callerPhone && `Telefon: ${callerPhone}`,
    data.callerEmail && `E-Mail: ${data.callerEmail}`,
    `Anliegen: ${reason}`,
    dateWarning && `ACHTUNG: Datum konnte nicht automatisch erkannt werden. Bitte manuell prüfen! Rohwert: "${dateStr || "nicht vorhanden"}"`,
    data.notes && `Notizen: ${data.notes}`,
  ].filter(Boolean);

  const description = descriptionParts.join("\\n");

  console.log(`[CalDAV] Creating event: name="${callerName}", reason="${reason}", dateRaw="${dateStr}", parsed=${parsedDate?.toISOString() || "PARSE FAILED"}, appointmentDate="${data.appointmentDate || ""}", summaryDate="${fromSummary.date || ""}", warning=${dateWarning}`);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Clickfabrik//Telefonagent//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Zurich",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=Europe/Zurich:${dtstart}`,
    `DTEND;TZID=Europe/Zurich:${dtend}`,
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

  console.log(`[CalDAV] Connecting to ${serverUrl} as ${username}`);

  const client = new DAVClient({
    serverUrl,
    credentials: { username, password },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  await client.login();
  console.log(`[CalDAV] Login successful`);

  let calendar;

  if (calendarUrl) {
    const calendars = await client.fetchCalendars();
    console.log(`[CalDAV] Found ${calendars.length} calendars:`, calendars.map(c => ({ url: c.url, displayName: c.displayName })));
    calendar = calendars.find((c) => c.url === calendarUrl || c.url.includes(calendarUrl));
    if (!calendar) {
      // Append trailing slash if missing
      const urlWithSlash = calendarUrl.endsWith("/") ? calendarUrl : calendarUrl + "/";
      calendar = calendars.find((c) => c.url === urlWithSlash || c.url.includes(urlWithSlash));
    }
    if (!calendar) {
      console.warn(`[CalDAV] Calendar URL "${calendarUrl}" not found in list, using first calendar as fallback`);
      calendar = calendars[0] || { url: calendarUrl.endsWith("/") ? calendarUrl : calendarUrl + "/" };
    }
  } else {
    const calendars = await client.fetchCalendars();
    if (calendars.length === 0) {
      throw new Error("Kein Kalender gefunden.");
    }
    calendar = calendars[0];
  }

  console.log(`[CalDAV] Using calendar: ${calendar.url} (${(calendar as Record<string, unknown>).displayName || "unnamed"})`);

  const iCalString = generateICS(data);
  const filename = `${data.id}-${Date.now()}.ics`;

  console.log(`[CalDAV] Creating object: filename="${filename}", calendar="${calendar.url}"`);
  console.log(`[CalDAV] ICS content:\n${iCalString}`);

  const result = await client.createCalendarObject({
    calendar,
    filename,
    iCalString,
  });

  console.log(`[CalDAV] Result: ok=${result.ok}, status=${result.status}, statusText="${result.statusText}"`);

  if (!result.ok) {
    throw new Error(`CalDAV-Fehler: ${result.status} ${result.statusText}`);
  }

  console.log(`[CalDAV] Event erfolgreich erstellt!`);
}
