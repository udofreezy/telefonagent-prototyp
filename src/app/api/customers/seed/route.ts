import { NextResponse } from "next/server";
import { saveCustomer, getCustomers, getAgentConfig } from "@/lib/store";
import { createOrUpdateAssistant } from "@/lib/vapi";
import { Customer } from "@/types";

// Beispiel-Kunden für Clickfabrik (KMU-Kunden / Leads).
// Hinweis: Das Feld "patientenNr" wird hier als KundenNr genutzt,
// "treatments" als Projekt-/Auftragshistorie ("dentist" = zuständiger Ansprechpartner).
const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cust-seed-001",
    patientenNr: "K-2024-001",
    name: "Café Verde GmbH",
    phone: "+41 76 432 11 88",
    email: "hallo@cafeverde.ch",
    address: "Steinenvorstadt 42, 4051 Basel",
    notes: "Inhaberin: Frau Lena Brunner. Kleines Café mit eigenem Bohnen-Onlineshop. Möchte mehr Reichweite auf Instagram und einen frischen Webauftritt. Bevorzugt Anrufe am Vormittag. Reagiert gut auf konkrete Vorher-Nachher-Beispiele.",
    lastVisit: "2026-03-12",
    treatments: [
      {
        id: "proj-001-1",
        date: "2026-03-12",
        description: "Social Media Marketing – Paket Starter (Instagram & Facebook)",
        dentist: "Account: Sandro",
        cost: 1090,
        notes: "Erste 2 Reels sehr gut performt. Reichweite +40% im ersten Monat. Verlängerung um 3 Monate besprochen.",
      },
      {
        id: "proj-001-2",
        date: "2025-11-20",
        description: "Website Face-Lift (WordPress) inkl. Online-Shop-Anbindung",
        dentist: "Lead: Mara",
        cost: 3800,
        notes: "Neue Startseite, schnellere Ladezeiten, WooCommerce-Shop für Kaffeebohnen angebunden.",
      },
      {
        id: "proj-001-3",
        date: "2025-06-10",
        description: "Logo-Auffrischung & Grafik-Vorlagen für Social Media",
        dentist: "Design: Nico",
        cost: 950,
        notes: "Neue Bildsprache und Vorlagen-Set für Posts erstellt.",
      },
    ],
    createdAt: "2025-06-01T10:00:00.000Z",
    updatedAt: "2026-03-12T14:30:00.000Z",
  },
  {
    id: "cust-seed-002",
    patientenNr: "K-2024-002",
    name: "Garage Hodel AG",
    phone: "+41 61 333 22 10",
    email: "info@garage-hodel.ch",
    address: "Riehenstrasse 105, 4058 Basel",
    notes: "Inhaber: Herr Josef Hodel. Familienbetrieb, eher klassisch. Wollte zuerst nur eine neue Webseite, jetzt auch Interesse am KI-Telefonagenten, weil oft niemand ans Telefon kann. Bevorzugt Nachmittagstermine ab 14 Uhr. Bitte einfach und ohne Fachjargon erklären.",
    lastVisit: "2026-04-02",
    treatments: [
      {
        id: "proj-002-0",
        date: "2026-04-02",
        description: "Beratung KI-Telefonagent (24/7 Anrufannahme)",
        dentist: "Lead: Mara",
        cost: 0,
        notes: "Kostenloses Erstgespräch geführt. Offerte für Telefonagent + Wartung versendet. Follow-up im Juli 2026.",
      },
      {
        id: "proj-002-1",
        date: "2026-01-15",
        description: "SEO & Performance-Optimierung der Webseite",
        dentist: "Account: Sandro",
        cost: 1400,
        notes: "Ladezeit von 4.2s auf 1.1s reduziert. Rankt jetzt für 'Garage Basel' auf Seite 1.",
      },
      {
        id: "proj-002-2",
        date: "2025-09-08",
        description: "Website Face-Lift (neue Webseite, mobiloptimiert)",
        dentist: "Lead: Mara",
        cost: 4200,
        notes: "Komplett neue Webseite mit Termin-Anfrageformular. Sehr zufrieden.",
      },
    ],
    createdAt: "2025-09-01T09:00:00.000Z",
    updatedAt: "2026-04-02T11:00:00.000Z",
  },
  {
    id: "cust-seed-003",
    patientenNr: "K-2025-003",
    name: "Sidney Muster (Personal Trainer)",
    phone: "+41 78 900 55 33",
    email: "sidney.muster@gmail.com",
    address: "Münchensteinerstrasse 8, 4052 Basel",
    notes: "Einzelunternehmer, Personal Trainer. Sehr aktiv auf TikTok und Instagram. Möchte den Auftritt professionalisieren und Kundengewinnung automatisieren. Arbeitet im Schichtbetrieb, flexible Terminwünsche (auch Abend/Wochenende). Neuer Lead aus Erstgespräch.",
    lastVisit: "2026-02-10",
    treatments: [
      {
        id: "proj-003-0",
        date: "2026-02-10",
        description: "Kostenloses Erstgespräch – Social Media & Landingpage",
        dentist: "Lead: Mara",
        cost: 0,
        notes: "Interesse an Paket Professional + einfacher Landingpage. Offerte über ca. 1690 CHF/Monat besprochen. Möchte sich bis Ende Monat entscheiden.",
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
      message: `3 Beispielkunden aktualisiert/hinzugefügt (${updated} aktualisiert).${agentSynced ? " Agent synchronisiert." : ""}`,
      total,
      agentSynced,
    });
  } catch (error) {
    console.error("Error seeding customers:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen der Beispieldaten." }, { status: 500 });
  }
}
