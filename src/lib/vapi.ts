import { VapiClient } from "@vapi-ai/server-sdk";
import { AgentConfig } from "@/types";
import { buildSystemPrompt, buildGreeting, getTemplate } from "./templates";

const DEFAULT_CARTESIA_VOICE_ID = "3f4ade23-6eb4-4279-ab05-6a144947c4d5"; // German Conversational Woman

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getCartesiaVoiceId(voiceId?: string): string {
  if (voiceId && UUID_REGEX.test(voiceId)) return voiceId;
  return DEFAULT_CARTESIA_VOICE_ID;
}

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
      endpointing: 200,
      keywords: [
        // Schweizer Städte & Ortsnamen
        "Basel:5",
        "Zürich:5",
        "Bern:5",
        "Luzern:5",
        "Winterthur:4",
        "Lausanne:4",
        "Genf:4",
        "Biel:4",
        "Thun:4",
        "Aarau:4",
        "Olten:4",
        "Solothurn:4",
        "Baden:4",
        "Liestal:4",
        "Birsfelden:3",
        "Reinach:3",
        "Muttenz:3",
        "Allschwil:3",
        "Binningen:3",
        "Riehen:3",
        "Pratteln:3",
        "Münchenstein:3",
        "Arlesheim:3",
        "Oberwil:3",
        "Bottmingen:3",
        // Zahnarzt-Fachbegriffe
        "Zahnreinigung:3",
        "Kontrolluntersuchung:3",
        "Kontrolle:2",
        "Implantate:3",
        "Bleaching:3",
        "Krone:2",
        "Brücke:2",
        "Füllung:2",
      ],
    },
    model: {
      provider: "openai" as const,
      model: "gpt-4o-mini" as const,
      messages: [
        {
          role: "system" as const,
          content: systemPrompt,
        },
      ],
      temperature: 0.6,
      maxTokens: 200,
    },
    voice: {
      provider: "cartesia" as const,
      voiceId: getCartesiaVoiceId(config.voiceId),
      model: "sonic-3" as const,
      language: "de" as const,
      generationConfig: {
        speed: 1.05,
      },
    },
    backgroundSound: "off" as const,
    backchannelingEnabled: true,
    startSpeakingPlan: {
      waitSeconds: 0.2,
      smartEndpointingEnabled: true,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.05,
        onNoPunctuationSeconds: 0.6,
        onNumberSeconds: 0.3,
      },
    },
    stopSpeakingPlan: {
      numWords: 0,
      voiceSeconds: 0.2,
      backoffSeconds: 0.8,
    },
    backgroundDenoisingEnabled: true,
    silenceTimeoutSeconds: 45,
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
              `Extrahiere die strukturierten Daten aus dem Telefongespräch.

WICHTIGE REGELN:
- Notiere das Anliegen/den Grund des Anrufs so präzise wie möglich (z.B. "Kontrolle", "Zahnreinigung", "Beratung Trauringe", NICHT einfach nur "Termin").
- Wenn ein Feld nicht genannt wurde, lasse es leer.
- Die Telefonnummer kommt automatisch vom System – extrahiere sie nur wenn sie explizit im Gespräch genannt wird.
- DATUM/UHRZEIT: Löse relative Zeitangaben wie "morgen", "übermorgen", "nächste Woche", "am Montag" in ein konkretes Datum auf. Das Gespräch fand am {{call.startedAt}} statt. Berechne das korrekte Datum relativ dazu. Format: "DD.MM.YYYY HH:mm" (z.B. "24.04.2026 13:00"). Wenn der Agent im Gespräch ein konkretes Datum bestätigt hat, verwende dieses.`,
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
            callerPhone: { type: "string" as const, description: "Telefonnummer des Anrufers (nur wenn explizit im Gespräch genannt)" },
            callerEmail: { type: "string" as const, description: "E-Mail-Adresse des Anrufers (nur wenn explizit genannt)" },
            reason: { type: "string" as const, description: "Konkreter Grund des Anrufs (z.B. 'Kontrolle', 'Zahnreinigung', 'Beratung', NICHT nur 'Termin')" },
            appointmentRequested: {
              type: "boolean" as const,
              description: "Wurde ein Termin angefragt oder vereinbart?",
            },
            appointmentDate: {
              type: "string" as const,
              description: "Gewünschtes Datum und Uhrzeit im Format DD.MM.YYYY HH:mm. Relative Angaben wie 'morgen' müssen in ein konkretes Datum aufgelöst werden.",
            },
            callbackRequested: {
              type: "boolean" as const,
              description: "Wurde ein Rückruf gewünscht?",
            },
            urgency: {
              type: "string" as const,
              description: "Dringlichkeit: niedrig, mittel, hoch",
            },
            notes: { type: "string" as const, description: "Zusätzliche Notizen oder Hinweise aus dem Gespräch" },
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
