import { NextRequest, NextResponse } from "next/server";
import { saveCallLog } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message;

    if (!message?.type) {
      return NextResponse.json({ ok: true });
    }

    console.log(`[Webhook] Received: ${message.type}`);

    switch (message.type) {
      case "end-of-call-report": {
        const call = message.call;
        if (call) {
          await saveCallLog({
            id: call.id,
            assistantId: call.assistantId || "",
            phoneNumber: call.customer?.number,
            startedAt: call.startedAt || call.createdAt || "",
            endedAt: call.endedAt,
            duration: call.duration,
            status: call.status || "ended",
            summary: message.summary || call.summary,
            transcript: message.transcript || call.transcript,
            recordingUrl: call.recordingUrl,
            cost: call.cost,
          });
          console.log(`[Webhook] Saved end-of-call report for call ${call.id}`);
        }
        break;
      }

      case "status-update": {
        const call = message.call;
        if (call) {
          console.log(`[Webhook] Call ${call.id} status: ${message.status}`);
        }
        break;
      }

      case "transcript": {
        console.log(`[Webhook] Transcript update: ${message.transcript?.slice(0, 100)}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled message type: ${message.type}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Vapi
  }
}
