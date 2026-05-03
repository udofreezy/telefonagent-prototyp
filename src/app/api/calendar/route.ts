import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/caldav";
import { getAppointments, getCallLogs } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, callId, callerName, callerPhone, callerEmail, reason, appointmentDate, notes, summary } = body;

    // If appointmentId is provided, load the full appointment data from store
    if (appointmentId) {
      const appointments = await getAppointments();
      const appointment = appointments.find((a) => a.id === appointmentId);

      if (!appointment) {
        return NextResponse.json(
          { error: "Termin nicht gefunden." },
          { status: 404 }
        );
      }

      // Try to get summary from the related call log as fallback for date extraction
      let callSummary: string | undefined;
      if (!appointment.appointmentDate) {
        const callLogs = await getCallLogs();
        const relatedCall = callLogs.find((c) => c.id === appointment.callId);
        callSummary = relatedCall?.summary;
      }

      console.log(`[Calendar API] From appointment:`, JSON.stringify({
        appointmentId,
        callerName: appointment.callerName,
        reason: appointment.reason,
        appointmentDate: appointment.appointmentDate,
        hasFallbackSummary: !!callSummary,
      }));

      await createCalendarEvent({
        id: `apt-${appointmentId}`,
        callerName: appointment.callerName,
        callerPhone: appointment.callerPhone,
        callerEmail: appointment.callerEmail,
        reason: appointment.reason,
        appointmentDate: appointment.appointmentDate,
        notes: appointment.notes,
        summary: callSummary,
      });

      return NextResponse.json({ ok: true });
    }

    // Legacy path: direct data from CallHistory
    if (!callId) {
      return NextResponse.json(
        { error: "callId oder appointmentId erforderlich." },
        { status: 400 }
      );
    }

    console.log(`[Calendar API] From call:`, JSON.stringify({ callId, callerName, reason, appointmentDate, hasSummary: !!summary }));

    await createCalendarEvent({
      id: `call-${callId}`,
      callerName,
      callerPhone,
      callerEmail,
      reason,
      appointmentDate,
      notes,
      summary,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("CalDAV error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Fehler beim Eintragen in den Kalender.",
      },
      { status: 500 }
    );
  }
}
