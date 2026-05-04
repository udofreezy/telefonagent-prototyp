import { NextRequest, NextResponse } from "next/server";
import { saveCallLog, saveCallStatus, getCallStatus, saveAppointment, findCustomerByPhone, findCustomerByName, saveCustomer } from "@/lib/store";

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
          const analysis = message.analysis || call.analysis || {};
          const callLog = {
            id: call.id,
            assistantId: call.assistantId || "",
            phoneNumber: call.customer?.number,
            startedAt: call.startedAt || call.createdAt || "",
            endedAt: call.endedAt,
            duration: call.duration,
            status: "ended",
            summary: analysis.summary || message.summary || call.summary,
            transcript: message.transcript || call.transcript,
            recordingUrl: call.recordingUrl,
            cost: call.cost,
            structuredData: analysis.structuredData,
            successEvaluation:
              typeof analysis.successEvaluation === "string"
                ? analysis.successEvaluation
                : undefined,
          };
          await saveCallLog(callLog);

          // Auto-create appointment entry from every call
          {
            const sd = analysis.structuredData || {};
            const customerPhone = call.customer?.number;
            console.log(`[Webhook] structuredData for ${call.id}:`, JSON.stringify(sd));
            console.log(`[Webhook] customer phone: ${customerPhone}`);
            // Try to match caller to existing customer
            let customerId: string | undefined;
            const phoneToMatch = sd.callerPhone || customerPhone;
            let matchedCustomer = phoneToMatch ? await findCustomerByPhone(phoneToMatch) : null;
            if (!matchedCustomer && sd.callerName) {
              matchedCustomer = await findCustomerByName(sd.callerName);
            }
            if (matchedCustomer) {
              customerId = matchedCustomer.id;
              console.log(`[Webhook] Matched caller to customer: ${matchedCustomer.name} (${matchedCustomer.patientenNr})`);
              // Update lastVisit
              await saveCustomer({ ...matchedCustomer, lastVisit: new Date().toISOString().split("T")[0] });
            }

            await saveAppointment({
              id: `apt-${call.id}-${Date.now()}`,
              callId: call.id,
              callerName: sd.callerName,
              callerPhone: sd.callerPhone || customerPhone,
              callerEmail: sd.callerEmail,
              appointmentDate: sd.appointmentDate,
              reason: sd.reason,
              notes: sd.notes,
              status: "pending",
              customerId,
              createdAt: new Date().toISOString(),
            });
            console.log(`[Webhook] Auto-created appointment for call ${call.id} (name: ${sd.callerName || 'n/a'}, reason: ${sd.reason || 'n/a'}, customerId: ${customerId || 'none'})`);
          }

          // Update live status with the completed call
          await saveCallStatus({
            active: false,
            callId: call.id,
            phoneNumber: call.customer?.number,
            startedAt: call.startedAt || call.createdAt,
            latestCall: callLog,
          });

          console.log(`[Webhook] Saved end-of-call report for call ${call.id}`);
        }
        break;
      }

      case "status-update": {
        const call = message.call;
        if (call) {
          const status = message.status;
          console.log(`[Webhook] Call ${call.id} status: ${status}`);

          if (status === "in-progress") {
            await saveCallStatus({
              active: true,
              callId: call.id,
              phoneNumber: call.customer?.number,
              startedAt: call.startedAt || call.createdAt || new Date().toISOString(),
            });
          } else if (status === "ended") {
            // Mark as not active, but keep existing latestCall if available
            const current = await getCallStatus();
            await saveCallStatus({
              ...current,
              active: false,
              callId: call.id,
            });
          }
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
