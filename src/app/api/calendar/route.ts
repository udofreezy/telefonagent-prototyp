import { NextRequest, NextResponse } from "next/server";
import { getAppointments } from "@/lib/store";
import { createCalendarEvent } from "@/lib/caldav";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId erforderlich." },
        { status: 400 }
      );
    }

    const appointments = await getAppointments();
    const appointment = appointments.find((a) => a.id === appointmentId);

    if (!appointment) {
      return NextResponse.json(
        { error: "Termin nicht gefunden." },
        { status: 404 }
      );
    }

    await createCalendarEvent(appointment);

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
