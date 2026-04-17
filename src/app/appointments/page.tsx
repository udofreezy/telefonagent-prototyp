import { AppointmentList } from "@/components/AppointmentList";

export default function AppointmentsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Termine</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Terminanfragen aus Anrufen verwalten, bestätigen und in Google Calendar
          eintragen.
        </p>
      </div>
      <AppointmentList />
    </div>
  );
}
