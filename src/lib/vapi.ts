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
      temperature: 0.7,
      maxTokens: 300,
    },
    voice: {
      provider: "11labs" as const,
      voiceId: config.voiceId || "EXAVITQu4vr4xnSDxMaL" as const,
      stability: 0.6,
      similarityBoost: 0.75,
      speed: 1.0,
      model: "eleven_turbo_v2" as const,
      language: "de",
    },
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    endCallMessage: "Vielen Dank für Ihren Anruf. Auf Wiederhören!",
    serverUrl: process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`
      : undefined,
  };

  if (config.vapiAssistantId) {
    // Update existing assistant
    await client.assistants.update(config.vapiAssistantId, assistantConfig);
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
  return (phoneNumber as Record<string, unknown>).number as string || phoneNumberId;
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
  await client.assistants.delete(assistantId);
}
