"use client";

import { useState, useEffect } from "react";
import { AgentConfig, BusinessType } from "@/types";
import { buildGreeting, getTemplate } from "@/lib/templates";
import { BusinessTypeSelector } from "./BusinessTypeSelector";
import { TestCallButton } from "./TestCallButton";
import { LiveCallPanel } from "./LiveCallPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  RotateCcw,
  Building2,
  MessageSquare,
  Clock,
  Mic,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Play,
} from "lucide-react";

const VOICE_OPTIONS = [
  { id: "3f4ade23-6eb4-4279-ab05-6a144947c4d5", label: "German Conversational Woman", desc: "Weiblich, freundlich", lang: "DE", recommended: true },
  { id: "b9de4a89-2257-424b-94c2-db18ba68c81a", label: "German Woman", desc: "Weiblich, klar", lang: "DE" },
  { id: "119e03e4-0705-43c9-b3ac-a658ce2b6639", label: "German Reporter Woman", desc: "Weiblich, professionell", lang: "DE" },
  { id: "384b625b-da5d-49e8-a76d-a2855d4f31eb", label: "German Conversation Man", desc: "Männlich, seriös", lang: "DE" },
  { id: "fb9fcab6-aba5-49ec-8d7e-3f1100296dde", label: "Friendly German Man", desc: "Männlich, freundlich", lang: "DE" },
  { id: "3f6e78a8-5283-42aa-b5e7-af82e8bb310c", label: "German Reporter Man", desc: "Männlich, professionell", lang: "DE" },
  { id: "db229dfe-f5de-4be4-91fd-7b077c158578", label: "German Storyteller Man", desc: "Männlich, erzählerisch", lang: "DE" },
];

const STEPS = [
  { id: 1, title: "Unternehmen", icon: Building2, desc: "Branche & Name" },
  { id: 2, title: "Begrüssung", icon: MessageSquare, desc: "Text & Services" },
  { id: 3, title: "Details", icon: Clock, desc: "Zeiten & Extras" },
  { id: 4, title: "Stimme", icon: Mic, desc: "Stimme wählen" },
  { id: 5, title: "Aktivieren", icon: CheckCircle2, desc: "Prüfen & starten" },
];

export function AgentConfigurator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<AgentConfig>({
    businessName: "",
    businessType: "allgemein",
    greeting: "",
    services: "",
    openingHours: "",
    additionalInstructions: "",
    calendarEnabled: false,
    voiceId: VOICE_OPTIONS[0].id,
  });
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/assistants");
        if (res.ok) {
          const data = await res.json();
          if (data && data.businessName) {
            // Migrate old ElevenLabs voiceId to Cartesia default
            const knownIds = VOICE_OPTIONS.map(v => v.id);
            if (data.voiceId && !knownIds.includes(data.voiceId)) {
              data.voiceId = VOICE_OPTIONS[0].id;
            }
            setConfig(data);
            setCurrentStep(5);
          }
        }
      } catch {
        // No existing config
      } finally {
        setLoadingExisting(false);
      }
    }
    loadConfig();
  }, []);

  const handleBusinessTypeChange = (type: BusinessType) => {
    const template = getTemplate(type);
    setConfig((prev) => ({
      ...prev,
      businessType: type,
      greeting: buildGreeting(template, prev.businessName || "{name}"),
      services: template.services,
      openingHours: template.openingHours,
    }));
  };

  const handleNameChange = (name: string) => {
    const template = getTemplate(config.businessType);
    setConfig((prev) => ({
      ...prev,
      businessName: name,
      greeting: buildGreeting(template, name || "{name}"),
    }));
  };

  const handleSubmit = async () => {
    if (!config.businessName.trim()) {
      setError("Bitte geben Sie einen Firmennamen ein.");
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Erstellen des Agenten.");
      }

      setConfig(data.config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Möchten Sie den Agenten wirklich zurücksetzen?")) return;

    setLoading(true);
    setError(null);

    try {
      await fetch("/api/assistants", { method: "DELETE" });
      setConfig({
        businessName: "",
        businessType: "allgemein",
        greeting: "",
        services: "",
        openingHours: "",
        additionalInstructions: "",
        calendarEnabled: false,
        voiceId: VOICE_OPTIONS[0].id,
      });
      setCurrentStep(1);
    } catch {
      setError("Fehler beim Zurücksetzen.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return config.businessName.trim().length > 0;
      case 2: return config.greeting.trim().length > 0;
      case 3: return true;
      case 4: return config.voiceId.length > 0;
      case 5: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (loadingExisting) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-[#c9a96e]/20" />
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-[#c9a96e]" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Agent wird geladen...</p>
      </div>
    );
  }

  const selectedVoice = VOICE_OPTIONS.find(v => v.id === config.voiceId);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* Main Wizard */}
      <div className="space-y-6">
        {/* Step Progress Bar */}
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`group flex flex-col items-center gap-2 transition-all duration-300 ${
                    step.id === currentStep
                      ? "scale-105"
                      : step.id < currentStep
                      ? "opacity-80 hover:opacity-100"
                      : "opacity-40"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${
                      step.id === currentStep
                        ? "bg-[#c9a96e] text-white shadow-lg shadow-[#c9a96e]/30"
                        : step.id < currentStep
                        ? "bg-[#c9a96e]/10 text-[#c9a96e]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${
                      step.id === currentStep ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.title}
                    </p>
                    <p className="hidden text-[10px] text-muted-foreground sm:block">
                      {step.desc}
                    </p>
                  </div>
                </button>
                {index < STEPS.length - 1 && (
                  <div className="mx-2 hidden h-[2px] w-8 sm:block md:w-12 lg:w-16">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        step.id < currentStep ? "bg-[#c9a96e]" : "bg-border"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
          {/* Step 1: Business */}
          {currentStep === 1 && (
            <div className="animate-fade-in-up space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Unternehmen einrichten</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wählen Sie die Branche und geben Sie den Firmennamen ein.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Firmenname *
                  </Label>
                  <Input
                    id="businessName"
                    placeholder='z.B. "Praxis Müller" oder "Restaurant Sonne"'
                    value={config.businessName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-11 rounded-xl bg-background/50 text-base"
                  />
                </div>

                <BusinessTypeSelector
                  value={config.businessType}
                  onChange={handleBusinessTypeChange}
                />
              </div>
            </div>
          )}

          {/* Step 2: Greeting & Services */}
          {currentStep === 2 && (
            <div className="animate-fade-in-up space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Begrüssung & Services</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Passen Sie die Begrüssung und Dienstleistungen an.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="greeting" className="text-sm font-medium">Begrüssung</Label>
                  <Input
                    id="greeting"
                    value={config.greeting}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, greeting: e.target.value }))
                    }
                    placeholder="Wie soll der Agent sich melden?"
                    className="h-11 rounded-xl bg-background/50 text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatisch generiert - frei editierbar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="services" className="text-sm font-medium">Dienstleistungen</Label>
                  <Textarea
                    id="services"
                    value={config.services}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, services: e.target.value }))
                    }
                    placeholder="Welche Services bietet das Unternehmen an?"
                    rows={4}
                    className="rounded-xl bg-background/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="animate-fade-in-up space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Zeiten & Anweisungen</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Öffnungszeiten und spezielle Anweisungen festlegen.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="openingHours" className="text-sm font-medium">Öffnungszeiten</Label>
                  <Input
                    id="openingHours"
                    value={config.openingHours}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, openingHours: e.target.value }))
                    }
                    placeholder="z.B. Mo-Fr 8:00-18:00"
                    className="h-11 rounded-xl bg-background/50 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInstructions" className="text-sm font-medium">
                    Zusätzliche Anweisungen
                  </Label>
                  <Textarea
                    id="additionalInstructions"
                    value={config.additionalInstructions}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        additionalInstructions: e.target.value,
                      }))
                    }
                    placeholder="Spezielle Wünsche oder Anweisungen für den Agenten..."
                    rows={4}
                    className="rounded-xl bg-background/50"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/30 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Terminbuchung</Label>
                    <p className="text-xs text-muted-foreground">
                      Google Calendar Integration (Coming Soon)
                    </p>
                  </div>
                  <Switch
                    checked={config.calendarEnabled}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({ ...prev, calendarEnabled: checked }))
                    }
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Voice */}
          {currentStep === 4 && (
            <div className="animate-fade-in-up space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Stimme auswählen</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wählen Sie die passende Stimme für Ihren Agenten.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {VOICE_OPTIONS.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setConfig((prev) => ({ ...prev, voiceId: voice.id }))}
                    className={`group relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                      config.voiceId === voice.id
                        ? "border-[#c9a96e] bg-[#c9a96e]/5 shadow-md shadow-[#c9a96e]/10"
                        : "border-border/50 bg-background/30 hover:border-border hover:bg-background/50"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      config.voiceId === voice.id
                        ? "bg-[#c9a96e] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Volume2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{voice.label}</p>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          voice.lang === "DE"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-blue-500/10 text-blue-500"
                        }`}>
                          {voice.lang}
                        </span>
                        {voice.recommended && (
                          <span className="rounded-md bg-[#c9a96e]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#c9a96e]">
                            Empfohlen
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{voice.desc}</p>
                    </div>
                    {config.voiceId === voice.id && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#c9a96e]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="animate-fade-in-up space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Zusammenfassung</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prüfen Sie die Konfiguration und aktivieren Sie den Agenten.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Unternehmen</p>
                    <p className="text-sm font-medium">{config.businessName || "—"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">{config.businessType}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Stimme</p>
                    <p className="text-sm font-medium">{selectedVoice?.label || "—"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{selectedVoice?.desc}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Begrüssung</p>
                  <p className="text-sm italic text-muted-foreground">&quot;{config.greeting || "—"}&quot;</p>
                </div>

                {config.services && (
                  <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Services</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{config.services}</p>
                  </div>
                )}

                {config.openingHours && (
                  <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Öffnungszeiten</p>
                    <p className="text-sm text-muted-foreground">{config.openingHours}</p>
                  </div>
                )}

                {config.additionalInstructions && (
                  <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Zusatzanweisungen</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{config.additionalInstructions}</p>
                  </div>
                )}
              </div>

              {/* Error / Success Messages */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Agent erfolgreich erstellt und aktiviert!
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#d4bf94] text-white font-semibold shadow-lg shadow-[#c9a96e]/25 hover:shadow-[#c9a96e]/40 hover:brightness-110 transition-all border-0"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {config.vapiAssistantId
                    ? "Agent aktualisieren"
                    : "Agent erstellen & aktivieren"}
                </Button>
                {config.vapiAssistantId && (
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                    size="lg"
                    className="h-12 rounded-xl"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="rounded-xl"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Zurück
              </Button>
              <div className="flex items-center gap-1.5">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step.id === currentStep
                        ? "w-6 bg-[#c9a96e]"
                        : step.id < currentStep
                        ? "w-1.5 bg-[#c9a96e]/50"
                        : "w-1.5 bg-border"
                    }`}
                  />
                ))}
              </div>
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="rounded-xl bg-[#c9a96e] text-white hover:bg-[#b8955a] border-0"
              >
                Weiter
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <TestCallButton
          phoneNumber={config.phoneNumber}
          assistantId={config.vapiAssistantId}
        />

        {config.vapiAssistantId && <LiveCallPanel />}

        {/* How it works */}
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">So funktioniert&apos;s</h3>
          <div className="space-y-4">
            {[
              { n: "1", text: "Branche & Firmenname eingeben" },
              { n: "2", text: "Begrüssung & Services anpassen" },
              { n: "3", text: "Zeiten & Anweisungen festlegen" },
              { n: "4", text: "Stimme auswählen" },
              { n: "5", text: "Agent aktivieren & Nummer anrufen" },
            ].map((item) => (
              <div key={item.n} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#c9a96e]/10 text-xs font-bold text-[#c9a96e]">
                  {item.n}
                </span>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
