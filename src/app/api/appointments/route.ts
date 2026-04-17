import { NextRequest, NextResponse } from "next/server";
import { getAppointments, saveAppointment, deleteAppointment } from "@/lib/store";

export async function GET() {
  try {
    const appointments = await getAppointments();
    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Termine." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id und status erforderlich." }, { status: 400 });
    }

    const appointments = await getAppointments();
    const appointment = appointments.find((a) => a.id === id);

    if (!appointment) {
      return NextResponse.json({ error: "Termin nicht gefunden." }, { status: 404 });
    }

    await saveAppointment({ ...appointment, status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id erforderlich." }, { status: 400 });
    }

    await deleteAppointment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen." },
      { status: 500 }
    );
  }
}
