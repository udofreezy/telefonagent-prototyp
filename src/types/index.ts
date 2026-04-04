export type BusinessType =
  | "physiotherapie"
  | "zahnarzt"
  | "restaurant"
  | "reinigung"
  | "juwelier"
  | "allgemein";

export interface BusinessTemplate {
  id: BusinessType;
  label: string;
  greeting: string;
  services: string;
  systemPromptTemplate: string;
  openingHours: string;
}

export interface AgentConfig {
  id?: string;
  businessName: string;
  businessType: BusinessType;
  greeting: string;
  services: string;
  openingHours: string;
  additionalInstructions: string;
  calendarEnabled: boolean;
  voiceId: string;
  vapiAssistantId?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CallLog {
  id: string;
  assistantId: string;
  phoneNumber?: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  status: string;
  summary?: string;
  transcript?: string;
  recordingUrl?: string;
  cost?: number;
}

export interface WebhookPayload {
  message: {
    type: string;
    call?: {
      id: string;
      assistantId: string;
      phoneNumber?: { number: string };
      customer?: { number: string };
      startedAt?: string;
      endedAt?: string;
      transcript?: string;
      summary?: string;
      recordingUrl?: string;
      cost?: number;
    };
    transcript?: string;
    summary?: string;
  };
}
