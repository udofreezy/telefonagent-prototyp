import { NextRequest, NextResponse } from "next/server";
import { getAppointments, saveAppointment, deleteAppointment, getAgentConfig, getCallLogs } from "@/lib/store";
import { listCalls } from "@/lib/vapi";
import { CallStructuredData } from "@/types";

// Sync: check VAPI calls and create/update appointments with latest data
async function syncAppointmentsFromCalls() {
  try {
    const config = await getAgentConfig();
    if (!config?.vapiAssistantId) return;

    const appointments = await getAppointments();
    const existingByCallId = new Map(appointments.map((a) => [a.callId, a]));

    // Get calls from VAPI + local storage
    const storedLogs = await getCallLogs();
    const storedById = new Map(storedLogs.map((l) => [l.id, l]));

    const calls = (await listCalls(config.vapiAssistantId)) as unknown as Array<
      Record<string, unknown>
    >;

    for (const call of Array.isArray(calls) ? calls : []) {
      const id = call.id as string;
      const analysis = (call.analysis as Record<string, unknown> | undefined) ?? {};
      const stored = storedById.get(id);
      const sd =
        (analysis.structuredData as CallStructuredData | undefined) ||
        stored?.structuredData ||
        {};

      const callerPhone = sd.callerPhone || ((call.customer as Record<string, unknown>)?.number as string);

      const existing = existingByCallId.get(id);

      if (existing) {
        // Update existing appointment if VAPI now has better data
        const needsUpdate =
          (!existing.callerName && sd.callerName) ||
          (!existing.callerPhone && callerPhone) ||
          (!existing.reason && sd.reason) ||
          (!existing.appointmentDate && sd.appointmentDate) ||
          (!existing.notes && sd.notes) ||
          (!existing.callerEmail && sd.callerEmail);

        if (needsUpdate) {
          await saveAppointment({
            ...existing,
            callerName: existing.callerName || sd.callerName,
            callerPhone: existing.callerPhone || callerPhone,
            callerEmail: existing.callerEmail || sd.callerEmail,
            appointmentDate: existing.appointmentDate || sd.appointmentDate,
            reason: existing.reason || sd.reason,
            notes: existing.notes || sd.notes,
          });
          console.log(`[Appointments] Updated appointment with VAPI data for call ${id}`);
        }
      } else {
        // Create new appointment
        await saveAppointment({
          id: `apt-${id}-${Date.now()}`,
          callId: id,
          callerName: sd.callerName,
          callerPhone: callerPhone,
          callerEmail: sd.callerEmail,
          appointmentDate: sd.appointmentDate,
          reason: sd.reason,
          notes: sd.notes,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        console.log(`[Appointments] Auto-synced appointment for call ${id}`);
      }
    }
  } catch (error) {
    console.error("[Appointments] Sync error:", error);
  }
}

export async function GET() {
  try {
    // Sync from VAPI calls first
    await syncAppointmentsFromCalls();

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
