import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/caldav";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callId, callerName, callerPhone, callerEmail, reason, appointmentDate, notes } = body;

    if (!callId) {
      return NextResponse.json(
        { error: "callId erforderlich." },
        { status: 400 }
      );
    }

    await createCalendarEvent({
      id: `call-${callId}`,
      callerName,
      callerPhone,
      callerEmail,
      reason,
      appointmentDate,
      notes,
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
