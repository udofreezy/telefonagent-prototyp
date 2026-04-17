import { CallHistory } from "@/components/CallHistory";

export default function CallsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Anrufprotokoll</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Übersicht aller Anrufe mit Transkripten und Zusammenfassungen.
        </p>
      </div>
      <CallHistory />
    </div>
  );
}
