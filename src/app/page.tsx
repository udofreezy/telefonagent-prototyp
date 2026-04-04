import { AgentConfigurator } from "@/components/AgentConfigurator";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          KI-Telefonagent konfigurieren
        </h1>
        <p className="mt-2 text-muted-foreground">
          Erstellen Sie in 2 Minuten einen personalisierten Telefonagenten
          f&uuml;r Ihren Kunden.
        </p>
      </div>
      <AgentConfigurator />
    </div>
  );
}
