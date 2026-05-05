import { NextRequest, NextResponse } from "next/server";
import { AgentConfig } from "@/types";
import { getAgentConfig, saveAgentConfig } from "@/lib/store";
import { createOrUpdateAssistant, assignPhoneNumber, deleteAssistant } from "@/lib/vapi";

export async function GET() {
  const config = await getAgentConfig();
  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  try {
    const body: AgentConfig = await request.json();

    // Validate required fields
    if (!body.businessName || !body.businessType) {
      return NextResponse.json(
        { error: "Firmenname und Branche sind Pflichtfelder." },
        { status: 400 }
      );
    }

    // Get existing config to check for existing assistant
    const existing = await getAgentConfig();

    const config: AgentConfig = {
      ...body,
      vapiAssistantId: existing?.vapiAssistantId,
    };

    // Create or update assistant in Vapi
    const assistantId = await createOrUpdateAssistant(config);
    config.vapiAssistantId = assistantId;

    // Assign phone number to assistant
    const phoneNumber = await assignPhoneNumber(assistantId);
    if (phoneNumber) {
      config.phoneNumber = phoneNumber;
    }

    // Save config locally
    const saved = await saveAgentConfig(config);

    return NextResponse.json({
      success: true,
      config: saved,
      assistantId,
      phoneNumber,
    });
  } catch (error) {
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Fehler beim Erstellen des Agenten.",
      },
      { status: 500 }
    );
  }
}

// PATCH: Re-sync assistant with latest customer data
export async function PATCH() {
  try {
    const config = await getAgentConfig();
    if (!config?.vapiAssistantId || !config.businessName) {
      return NextResponse.json({ error: "Kein Agent konfiguriert." }, { status: 400 });
    }

    // Re-create updates the prompt with fresh customer data
    await createOrUpdateAssistant(config);

    return NextResponse.json({ success: true, message: "Agent mit aktuellen Patientendaten synchronisiert." });
  } catch (error) {
    console.error("Error syncing assistant:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Synchronisieren." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const config = await getAgentConfig();
    if (config?.vapiAssistantId) {
      await deleteAssistant(config.vapiAssistantId);
    }
    // Clear the local config
    await saveAgentConfig({
      businessName: "",
      businessType: "allgemein",
      greeting: "",
      services: "",
      openingHours: "",
      additionalInstructions: "",
      calendarEnabled: false,
      voiceId: "",
      vapiAssistantId: undefined,
      phoneNumber: undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Löschen." },
      { status: 500 }
    );
  }
}
