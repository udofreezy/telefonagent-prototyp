"use client";

import { useState, useEffect } from "react";
import { AgentConfig, BusinessType } from "@/types";
import { businessTemplates, buildGreeting, getTemplate } from "@/lib/templates";
import { BusinessTypeSelector } from "./BusinessTypeSelector";
import { TestCallButton } from "./TestCallButton";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";

const VOICE_OPTIONS = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah (weiblich, warm)" },
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel (weiblich, professionell)" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni (männlich, freundlich)" },
  { id: "VR6AewLTigWG4xSOukaG", label: "Arnold (männlich, klar)" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam (männlich, tief)" },
];

export function AgentConfigurator() {
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

  // Load existing config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/assistants");
        if (res.ok) {
          const data = await res.json();
          if (data && data.businessName) {
            setConfig(data);
          }
        }
      } catch {
        // No existing config, that's fine
      } finally {
        setLoadingExisting(false);
      }
    }
    loadConfig();
  }, []);

  // When business type changes, update template fields
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

  // When business name changes, update greeting
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
    } catch {
      setError("Fehler beim Zurücksetzen.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Configuration Form */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent konfigurieren</CardTitle>
            <CardDescription>
              Passen Sie den KI-Telefonagenten in wenigen Schritten an Ihren Kunden an.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Firmenname *</Label>
              <Input
                id="businessName"
                placeholder='z.B. "RM Miklos" oder "Praxis Müller"'
                value={config.businessName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            {/* Business Type */}
            <BusinessTypeSelector
              value={config.businessType}
              onChange={handleBusinessTypeChange}
            />

            {/* Greeting */}
            <div className="space-y-2">
              <Label htmlFor="greeting">Begrüssung</Label>
              <Input
                id="greeting"
                value={config.greeting}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, greeting: e.target.value }))
                }
                placeholder="Wie soll der Agent sich melden?"
              />
              <p className="text-xs text-muted-foreground">
                Wird automatisch aus Template und Firmenname generiert. Frei editierbar.
              </p>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <Label htmlFor="services">Dienstleistungen</Label>
              <Textarea
                id="services"
                value={config.services}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, services: e.target.value }))
                }
                placeholder="Welche Services bietet das Unternehmen an?"
                rows={3}
              />
            </div>

            {/* Opening Hours */}
            <div className="space-y-2">
              <Label htmlFor="openingHours">Öffnungszeiten</Label>
              <Input
                id="openingHours"
                value={config.openingHours}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, openingHours: e.target.value }))
                }
                placeholder="z.B. Mo-Fr 8:00-18:00"
              />
            </div>

            {/* Additional Instructions */}
            <div className="space-y-2">
              <Label htmlFor="additionalInstructions">
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
                rows={3}
              />
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice">Stimme</Label>
              <Select
                value={config.voiceId}
                onValueChange={(v) =>
                  setConfig((prev) => ({ ...prev, voiceId: v }))
                }
              >
                <SelectTrigger id="voice" className="w-full">
                  <SelectValue placeholder="Stimme auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendar Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Terminbuchung</Label>
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

            {/* Error / Success Messages */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                Agent erfolgreich erstellt und aktiviert!
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
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
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Zurücksetzen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: Test Call */}
      <div className="space-y-6">
        <TestCallButton
          phoneNumber={config.phoneNumber}
          assistantId={config.vapiAssistantId}
        />

        {/* Quick Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">So funktioniert&apos;s</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <p>Firmenname und Branche eingeben</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <p>Details anpassen (Begrüssung, Services, etc.)</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <p>&quot;Agent erstellen&quot; klicken</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                4
              </span>
              <p>Angezeigte Nummer anrufen - fertig!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
