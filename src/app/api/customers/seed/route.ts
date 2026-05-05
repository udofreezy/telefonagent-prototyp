import { NextResponse } from "next/server";
import { saveCustomer, getCustomers, getAgentConfig } from "@/lib/store";
import { createOrUpdateAssistant } from "@/lib/vapi";
import { Customer } from "@/types";

const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cust-seed-001",
    patientenNr: "P-2024-001",
    name: "Fabian Meier",
    phone: "+41 76 432 11 88",
    email: "f.meier@bluewin.ch",
    dateOfBirth: "1988-03-15",
    address: "Steinenvorstadt 42, 4051 Basel",
    notes: "Angstpatient - braucht etwas mehr Zeit und Einfühlungsvermögen. Bevorzugt Termine am Vormittag. Hat Zahnarztphobie seit Kindheit, reagiert gut auf Lachgas. Bevorzugter Standort: Basel Centralbahnstrasse.",
    allergies: "Penicillin, Ibuprofen (Magenprobleme)",
    lastVisit: "2026-03-12",
    insuranceType: "KVG",
    treatments: [
      {
        id: "treat-001-1",
        date: "2026-03-12",
        description: "Professionelle Zahnreinigung + Fluoridierung",
        dentist: "Dr. Keller",
        cost: 195,
        notes: "Zahnfleisch deutlich besser als beim letzten Mal. Mundhygiene hat sich verbessert. Nächste Reinigung in 6 Monaten empfohlen.",
      },
      {
        id: "treat-001-2",
        date: "2025-11-20",
        description: "Professionelle Zahnreinigung",
        dentist: "Dr. Keller",
        cost: 180,
        notes: "Leichte Zahnfleischentzündung festgestellt, Zahnseide-Anwendung empfohlen",
      },
      {
        id: "treat-001-3",
        date: "2025-06-10",
        description: "Füllung Zahn 36 (Komposit)",
        dentist: "Dr. Keller",
        cost: 320,
        notes: "Karies mesial, unter Lachgas-Sedierung durchgeführt. Patient hat es gut vertragen.",
      },
      {
        id: "treat-001-4",
        date: "2025-01-22",
        description: "Notfallbehandlung - akute Zahnschmerzen Zahn 36",
        dentist: "Dr. Ammann",
        cost: 180,
        notes: "Provisorische Füllung eingesetzt, definitive Versorgung in separatem Termin",
      },
      {
        id: "treat-001-5",
        date: "2024-12-05",
        description: "Jahreskontrolle + OPG-Röntgenbild",
        dentist: "Dr. Ammann",
        cost: 250,
        notes: "Weisheitszähne unauffällig, Karies an Zahn 36 entdeckt. Termin für Füllung vereinbart.",
      },
      {
        id: "treat-001-6",
        date: "2024-06-18",
        description: "Professionelle Zahnreinigung",
        dentist: "Dr. Keller",
        cost: 175,
        notes: "Erste Behandlung bei uns. Patient sehr nervös, hat Lachgas gut vertragen.",
      },
    ],
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2026-03-12T14:30:00.000Z",
  },
  {
    id: "cust-seed-002",
    patientenNr: "P-2024-002",
    name: "Heinz Josef",
    phone: "+41 61 333 22 10",
    email: "h.josef@sunrise.ch",
    dateOfBirth: "1955-08-22",
    address: "Riehenstrasse 105, 4058 Basel",
    notes: "Teilprothese Oberkiefer seit 2023. Regelmässige Kontrolle alle 3 Monate wichtig wegen Parodontitis-Vorgeschichte. Hört etwas schlecht auf dem linken Ohr - bitte laut und deutlich sprechen. Kommt immer mit dem Bus, bevorzugt Nachmittagstermine ab 14 Uhr. Standort Riehen bevorzugt, kommt aber auch nach Basel.",
    allergies: undefined,
    lastVisit: "2026-04-02",
    insuranceType: "VVG",
    treatments: [
      {
        id: "treat-002-0",
        date: "2026-04-02",
        description: "Parodontitis-Nachkontrolle + Zahnreinigung",
        dentist: "Dr. Keller",
        cost: 280,
        notes: "Taschentiefen stabil, gute Mitarbeit. Nächste Kontrolle in 3 Monaten (Juli 2026).",
      },
      {
        id: "treat-002-1",
        date: "2026-01-15",
        description: "Prothesenunterfütterung Oberkiefer",
        dentist: "Dr. Ammann",
        cost: 450,
        notes: "Prothese sass locker, Unterfütterung mit Kaltpolymerisat. Passt jetzt wieder gut.",
      },
      {
        id: "treat-002-2",
        date: "2025-09-08",
        description: "Parodontose-Behandlung (Quadrant 1+2) - Scaling & Root Planing",
        dentist: "Dr. Keller",
        cost: 680,
        notes: "Taschentiefen 4-6mm, Nachkontrolle in 3 Monaten",
      },
      {
        id: "treat-002-3",
        date: "2025-06-15",
        description: "Parodontose-Behandlung (Quadrant 3+4) - Scaling & Root Planing",
        dentist: "Dr. Keller",
        cost: 680,
        notes: "Zweite Sitzung der Paro-Behandlung",
      },
      {
        id: "treat-002-4",
        date: "2025-04-20",
        description: "Kontrolluntersuchung + Parodontal-Status",
        dentist: "Dr. Ammann",
        cost: 320,
        notes: "Generalisierte Parodontitis festgestellt, Behandlungsplan erstellt. 4 Sitzungen geplant.",
      },
      {
        id: "treat-002-5",
        date: "2024-11-12",
        description: "Extraktion Zahn 47 (nicht erhaltungswürdig)",
        dentist: "Dr. Keller",
        cost: 280,
        notes: "Komplikationsloser Verlauf, Zahn war stark gelockert durch Parodontitis",
      },
      {
        id: "treat-002-6",
        date: "2024-07-03",
        description: "Kontrolluntersuchung + Prothesenkontrolle",
        dentist: "Dr. Ammann",
        cost: 120,
      },
      {
        id: "treat-002-7",
        date: "2024-03-20",
        description: "Erstuntersuchung + OPG-Röntgen + Abdrücke für Prothese OK",
        dentist: "Dr. Ammann",
        cost: 380,
        notes: "Überweisung vom Hauszahnarzt. Zustand: multiple fehlende Zähne OK, Parodontitis, Zahn 47 gelockert.",
      },
    ],
    createdAt: "2024-03-20T09:00:00.000Z",
    updatedAt: "2026-04-02T11:00:00.000Z",
  },
  {
    id: "cust-seed-003",
    patientenNr: "P-2025-003",
    name: "Sidney Muster",
    phone: "+41 78 900 55 33",
    email: "sidney.muster@gmail.com",
    dateOfBirth: "1995-12-01",
    address: "Münchensteinerstrasse 8, 4052 Basel",
    notes: "Interesse an Bleaching und Veneers - beim nächsten Termin beraten. Arbeitet im Schichtdienst, daher flexible Terminwünsche (auch Abend und Wochenende). Sehr gepflegte Zähne, motivierter Patient. Möchte gerne weissere Zähne für eine Hochzeit im Herbst 2026.",
    allergies: "Latex (bitte latexfreie Handschuhe verwenden!)",
    lastVisit: "2026-02-10",
    insuranceType: "Privat",
    treatments: [
      {
        id: "treat-003-0",
        date: "2026-02-10",
        description: "Professionelle Zahnreinigung + Bleaching-Beratung",
        dentist: "Dr. Keller",
        cost: 195,
        notes: "Patient wünscht In-Office-Bleaching. Termin wird separat vereinbart. Kosten ca. 650 CHF besprochen. Zahnfarbe aktuell A3, Ziel A1.",
      },
      {
        id: "treat-003-1",
        date: "2025-08-14",
        description: "Professionelle Zahnreinigung",
        dentist: "Dr. Keller",
        cost: 180,
        notes: "Sehr gute Mundhygiene, kaum Zahnstein. Nächste Reinigung in 6 Monaten.",
      },
      {
        id: "treat-003-2",
        date: "2025-02-28",
        description: "Erstuntersuchung + OPG-Röntgen + Kontrolluntersuchung",
        dentist: "Dr. Ammann",
        cost: 290,
        notes: "Alles unauffällig, kein Karies, gesundes Zahnfleisch. Weisheitszähne vollständig durchgebrochen und unauffällig. Patient fragt nach Bleaching-Möglichkeiten.",
      },
    ],
    createdAt: "2025-02-28T08:30:00.000Z",
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
        console.log("[Seed] Agent synced with updated patient data");
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
