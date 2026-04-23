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

export interface CallStructuredData {
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
  reason?: string;
  appointmentRequested?: boolean;
  appointmentDate?: string;
  callbackRequested?: boolean;
  urgency?: "niedrig" | "mittel" | "hoch" | string;
  notes?: string;
}

export interface Appointment {
  id: string;
  callId: string;
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
  appointmentDate?: string;
  reason?: string;
  notes?: string;
  status: "pending" | "confirmed" | "rejected" | "deleted";
  createdAt: string;
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
  structuredData?: CallStructuredData;
  successEvaluation?: string;
}

export interface CallStatus {
  active: boolean;
  callId?: string;
  phoneNumber?: string;
  startedAt?: string;
  latestCall?: CallLog;
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
