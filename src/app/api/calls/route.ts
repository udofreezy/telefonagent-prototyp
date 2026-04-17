import { NextResponse } from "next/server";
import { listCalls } from "@/lib/vapi";
import { getAgentConfig, getCallLogs, clearCallLogs } from "@/lib/store";
import { CallLog, CallStructuredData } from "@/types";

export async function GET() {
  try {
    const config = await getAgentConfig();

    if (!config?.vapiAssistantId) {
      return NextResponse.json([]);
    }

    // Lokale (per Webhook gespeicherte) Logs als Basis - enthalten analysis.
    const storedLogs = await getCallLogs();
    const storedById = new Map(storedLogs.map((l) => [l.id, l]));

    const calls = (await listCalls(config.vapiAssistantId)) as unknown as Array<
      Record<string, unknown>
    >;

    const callLogs: CallLog[] = (Array.isArray(calls) ? calls : []).map((call) => {
      const id = call.id as string;
      const stored = storedById.get(id);
      const analysis = (call.analysis as Record<string, unknown> | undefined) ?? {};

      return {
        id,
        assistantId: (call.assistantId as string) || config.vapiAssistantId || "",
        phoneNumber:
          ((call.customer as Record<string, unknown>)?.number as string) || undefined,
        startedAt: (call.startedAt as string) || (call.createdAt as string) || "",
        endedAt: (call.endedAt as string) || undefined,
        duration: call.duration as number | undefined,
        status: (call.status as string) || "unknown",
        summary:
          (analysis.summary as string) ||
          (call.summary as string) ||
          stored?.summary ||
          undefined,
        transcript:
          (call.transcript as string) || stored?.transcript || undefined,
        recordingUrl: (call.recordingUrl as string) || undefined,
        cost: (call.cost as number) || undefined,
        structuredData:
          (analysis.structuredData as CallStructuredData | undefined) ||
          stored?.structuredData ||
          undefined,
        successEvaluation:
          (typeof analysis.successEvaluation === "string"
            ? (analysis.successEvaluation as string)
            : undefined) || stored?.successEvaluation,
      };
    });

    return NextResponse.json(callLogs);
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Laden der Anrufe." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearCallLogs();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error clearing calls:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Löschen." },
      { status: 500 }
    );
  }
}
