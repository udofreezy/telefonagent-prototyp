import { VapiClient } from "@vapi-ai/server-sdk";
import { AgentConfig } from "@/types";
import { buildSystemPrompt, buildGreeting, getTemplate } from "./templates";

function getClient() {
  const token = process.env.VAPI_API_KEY;
  if (!token) throw new Error("VAPI_API_KEY is not set");
  return new VapiClient({ token });
}

export async function createOrUpdateAssistant(config: AgentConfig): Promise<string> {
  const client = getClient();

  const systemPrompt = buildSystemPrompt({
    businessName: config.businessName,
    businessType: config.businessType,
    services: config.services,
    openingHours: config.openingHours,
    additionalInstructions: config.additionalInstructions,
  });

  const template = getTemplate(config.businessType);
  const firstMessage = buildGreeting(template, config.businessName);

  const assistantConfig = {
    name: `Telefonagent - ${config.businessName}`,
    firstMessage,
    firstMessageMode: "assistant-speaks-first" as const,
    transcriber: {
      provider: "deepgram" as const,
      language: "de" as const,
      model: "nova-2" as const,
      smartFormat: true,
      numerals: true,
      endpointing: 300,
    },
    model: {
      provider: "anthropic" as const,
      model: "claude-sonnet-4-5-20250929" as const,
      messages: [
        {
          role: "system" as const,
          content: systemPrompt,
        },
      ],
      temperature: 0.8,
      maxTokens: 300,
    },
    voice: {
      provider: "11labs" as const,
      voiceId: config.voiceId || "XrExE9yKIg1WjnnlVkGX" as const, // Matilda - multilingual, DE
      model: "eleven_multilingual_v2" as const,
      language: "de",
      stability: 0.35,
      similarityBoost: 0.8,
      style: 0.5,
      useSpeakerBoost: true,
      speed: 0.95,
      optimizeStreamingLatency: 3,
      enableSsmlParsing: true,
      fillerInjectionEnabled: false,
    },
    backgroundSound: "off" as const,
    backchannelingEnabled: false,
    backgroundDenoisingEnabled: true,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    endCallMessage: "Vielen Dank für Ihren Anruf. Auf Wiederhören!",
    analysisPlan: {
      summaryPlan: {
        enabled: true,
        timeoutSeconds: 30,
        messages: [
          {
            role: "system" as const,
            content: `Du bist ein professioneller Assistent, der Telefongespräche für das Unternehmen "${config.businessName}" (${config.businessType}) zusammenfasst.

Erstelle eine strukturierte deutsche Gesprächsnotiz im folgenden Format:

**Anrufer:** (Name, falls genannt, sonst "Unbekannt")
**Telefonnummer:** (falls genannt)
**Anliegen:** (Worum ging es im Gespräch? 1-2 Sätze)
**Besprochene Punkte:**
- (Stichpunkt 1)
- (Stichpunkt 2)
- (Stichpunkt 3)
**Termin/Reservierung:** (Datum, Uhrzeit, Details - falls vereinbart, sonst "Kein Termin")
**Rückruf gewünscht:** (Ja/Nein, mit Details)
**Nächste Schritte:** (Was muss das Unternehmen jetzt tun?)
**Sonstiges:** (Wichtige Zusatzinfos, Allergien, Sonderwünsche, etc.)

Sei präzise, aber vollständig. Notiere alle konkreten Informationen, die der Anrufer genannt hat.`,
          },
          {
            role: "user" as const,
            content:
              "Hier ist das Transkript des Gesprächs:\n\n{{transcript}}\n\nBitte erstelle die strukturierte Gesprächsnotiz.",
          },
        ],
      },
      structuredDataPlan: {
        enabled: true,
        timeoutSeconds: 30,
        messages: [
          {
            role: "system" as const,
            content:
              "Extrahiere die strukturierten Daten aus dem Telefongespräch. Wenn ein Feld nicht genannt wurde, lasse es leer.",
          },
          {
            role: "user" as const,
            content: "Transkript:\n\n{{transcript}}",
          },
        ],
        schema: {
          type: "object" as const,
          properties: {
            callerName: { type: "string" as const, description: "Name des Anrufers" },
            callerPhone: { type: "string" as const, description: "Telefonnummer des Anrufers" },
            callerEmail: { type: "string" as const, description: "E-Mail-Adresse des Anrufers" },
            reason: { type: "string" as const, description: "Grund des Anrufs" },
            appointmentRequested: {
              type: "boolean" as const,
              description: "Wurde ein Termin angefragt?",
            },
            appointmentDate: {
              type: "string" as const,
              description: "Gewünschtes Datum/Uhrzeit",
            },
            callbackRequested: {
              type: "boolean" as const,
              description: "Wurde ein Rückruf gewünscht?",
            },
            urgency: {
              type: "string" as const,
              description: "Dringlichkeit: niedrig, mittel, hoch",
            },
            notes: { type: "string" as const, description: "Zusätzliche Notizen" },
          },
        },
      },
      successEvaluationPlan: {
        enabled: true,
        rubric: "PassFail" as const,
      },
    },
    serverUrl: process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`
      : undefined,
  };

  if (config.vapiAssistantId) {
    // Update existing assistant
    await client.assistants.update({
      id: config.vapiAssistantId,
      ...assistantConfig,
    });
    return config.vapiAssistantId;
  } else {
    // Create new assistant
    const assistant = await client.assistants.create(assistantConfig);
    return assistant.id;
  }
}

export async function assignPhoneNumber(
  assistantId: string
): Promise<string | null> {
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (!phoneNumberId) return null;

  const client = getClient();

  await client.phoneNumbers.update({
    id: phoneNumberId,
    body: {
      assistantId,
    },
  });

  // Get the phone number details to return the actual number
  const phoneNumber = await client.phoneNumbers.get({ id: phoneNumberId });
  return (phoneNumber as unknown as Record<string, unknown>).number as string || phoneNumberId;
}

export async function listCalls(assistantId?: string) {
  const client = getClient();
  const calls = await client.calls.list(
    assistantId ? { assistantId } : undefined
  );
  return calls;
}

export async function getCall(callId: string) {
  const client = getClient();
  return client.calls.get({ id: callId });
}

export async function deleteAssistant(assistantId: string) {
  const client = getClient();
  await client.assistants.delete({ id: assistantId });
}
