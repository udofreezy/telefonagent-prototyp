import { NextResponse } from "next/server";
import { saveCustomer, getCustomers, getAgentConfig } from "@/lib/store";
import { createOrUpdateAssistant } from "@/lib/vapi";
import { Customer } from "@/types";

// Beispiel-Patienten für Die Zahnärzte (Netzwerk Basel/Riehen/Birsfelden).
const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cust-seed-001",
    patientenNr: "P-2024-001",
    name: "Lena Brunner",
    phone: "+41 76 432 11 88",
    email: "lena.brunner@bluewin.ch",
    dateOfBirth: "1988-04-12",
    address: "Steinenvorstadt 42, 4051 Basel",
    insuranceType: "KVG",
    allergies: "Penicillin",
    notes: "Stammpatientin Standort Basel SBB. Etwas ängstlich bei Spritzen – reagiert gut auf Lachgas-Angebot. Bevorzugt Termine am Vormittag.",
    lastVisit: "2026-03-12",
    treatments: [
      {
        id: "tx-001-1",
        date: "2026-03-12",
        description: "Kontrolle & professionelle Zahnreinigung",
        dentist: "Praxis Basel SBB",
        cost: 180,
        notes: "Unauffällig, nächste Kontrolle in 6 Monaten empfohlen.",
      },
      {
        id: "tx-001-2",
        date: "2025-09-20",
        description: "Kariesbehandlung Zahn 26",
        dentist: "Praxis Basel SBB",
        cost: 320,
        notes: "Füllung gelegt, keine Beschwerden seither.",
      },
      {
        id: "tx-001-3",
        date: "2025-03-10",
        description: "Erstuntersuchung & Prophylaxe",
        dentist: "Praxis Basel SBB",
        cost: 150,
        notes: "Neupatientin, vollständiger Befund erhoben.",
      },
    ],
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2026-03-12T14:30:00.000Z",
  },
  {
    id: "cust-seed-002",
    patientenNr: "P-2024-002",
    name: "Josef Hodel",
    phone: "+41 61 333 22 10",
    email: "josef.hodel@gmx.ch",
    dateOfBirth: "1965-11-03",
    address: "Riehenstrasse 105, 4058 Basel",
    insuranceType: "Privat",
    notes: "Stammpatient Standort Riehen Bahnhof. Trägt Implantat (2025). Bevorzugt Nachmittagstermine ab 14 Uhr. Bitte einfach und ohne Fachjargon erklären.",
    lastVisit: "2026-04-02",
    treatments: [
      {
        id: "tx-002-1",
        date: "2026-04-02",
        description: "Kontrolle nach Implantat-Eingliederung",
        dentist: "Praxis Riehen Bahnhof",
        cost: 0,
        notes: "Heilung gut verlaufen, keine Beschwerden.",
      },
      {
        id: "tx-002-2",
        date: "2025-11-15",
        description: "Implantat Zahn 36 (Straumann) inkl. Krone",
        dentist: "Praxis Riehen Bahnhof",
        cost: 3800,
        notes: "Basic Line, unkomplizierter Eingriff ohne Knochenaufbau.",
      },
      {
        id: "tx-002-3",
        date: "2025-06-08",
        description: "Erstberatung Implantat, Röntgenaufnahme",
        dentist: "Praxis Riehen Bahnhof",
        cost: 120,
        notes: "Zahn 36 nicht erhaltbar, Implantat empfohlen und besprochen.",
      },
    ],
    createdAt: "2025-06-01T09:00:00.000Z",
    updatedAt: "2026-04-02T11:00:00.000Z",
  },
  {
    id: "cust-seed-003",
    patientenNr: "P-2025-003",
    name: "Familie Muster (Kind: Sidney, 7 Jahre)",
    phone: "+41 78 900 55 33",
    email: "muster.family@gmail.com",
    dateOfBirth: "2019-02-10",
    address: "Münchensteinerstrasse 8, 4052 Basel",
    insuranceType: "KVG",
    notes: "Kinderpatient, Standort Riehen Schmiedgasse (Zahnhase). Erster Kontrollbesuch, etwas nervös aber kooperativ. Eltern wünschen spielerische Herangehensweise.",
    lastVisit: "2026-02-10",
    treatments: [
      {
        id: "tx-003-1",
        date: "2026-02-10",
        description: "Erste Kontrolle Zahnhase – spielerische Eingewöhnung",
        dentist: "Zahnhase Riehen Schmiedgasse",
        cost: 0,
        notes: "Keine Behandlung nötig, nur Kennenlernen der Praxis. Sehr positiv verlaufen.",
      },
    ],
    createdAt: "2026-02-10T08:30:00.000Z",
    updatedAt: "2026-02-10T16:00:00.000Z",
  },
];

export async function POST() {
  try {
    const existing = await getCustomers();
    const existingIds = new Set(existing.map((c) => c.id));

    // Delete old seed data and re-insert to get updated data
    let updated = 0;
    for (const customer of SEED_CUSTOMERS) {
      if (existingIds.has(customer.id)) {
        // Overwrite with enriched data
        await saveCustomer(customer);
        updated++;
      } else {
        await saveCustomer(customer);
      }
    }

    const total = (await getCustomers()).length;

    // Auto-sync agent with new customer data
    let agentSynced = false;
    try {
      const agentConfig = await getAgentConfig();
      if (agentConfig?.vapiAssistantId && agentConfig.businessName) {
        await createOrUpdateAssistant(agentConfig);
        agentSynced = true;
        console.log("[Seed] Agent synced with updated customer data");
      }
    } catch (err) {
      console.error("[Seed] Could not sync agent:", err);
    }

    return NextResponse.json({
      ok: true,
      message: `3 Beispielpatienten aktualisiert/hinzugefügt (${updated} aktualisiert).${agentSynced ? " Agent synchronisiert." : ""}`,
      total,
      agentSynced,
    });
  } catch (error) {
    console.error("Error seeding customers:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen der Beispieldaten." }, { status: 500 });
  }
}
