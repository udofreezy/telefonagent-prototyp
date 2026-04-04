import { NextResponse } from "next/server";
import { listCalls } from "@/lib/vapi";
import { getAgentConfig } from "@/lib/store";
import { CallLog } from "@/types";

export async function GET() {
  try {
    const config = await getAgentConfig();

    if (!config?.vapiAssistantId) {
      return NextResponse.json([]);
    }

    const calls = await listCalls(config.vapiAssistantId);

    const callLogs: CallLog[] = (Array.isArray(calls) ? calls : []).map(
      (call: Record<string, unknown>) => ({
        id: call.id as string,
        assistantId: (call.assistantId as string) || config.vapiAssistantId || "",
        phoneNumber:
          ((call.customer as Record<string, unknown>)?.number as string) || undefined,
        startedAt: (call.startedAt as string) || (call.createdAt as string) || "",
        endedAt: (call.endedAt as string) || undefined,
        duration: call.duration as number | undefined,
        status: (call.status as string) || "unknown",
        summary: (call.summary as string) || undefined,
        transcript: (call.transcript as string) || undefined,
        recordingUrl: (call.recordingUrl as string) || undefined,
        cost: (call.cost as number) || undefined,
      })
    );

    return NextResponse.json(callLogs);
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Laden der Anrufe." },
      { status: 500 }
    );
  }
}
