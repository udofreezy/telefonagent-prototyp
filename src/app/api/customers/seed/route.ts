import { NextResponse } from "next/server";
import { saveCustomer, getCustomers } from "@/lib/store";
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
    notes: "Angstpatient - braucht etwas mehr Zeit und Einfühlungsvermögen",
    allergies: "Penicillin",
    lastVisit: "2025-11-20",
    insuranceType: "KVG",
    treatments: [
      {
        id: "treat-001-1",
        date: "2025-11-20",
        description: "Professionelle Zahnreinigung",
        dentist: "Dr. Keller",
        cost: 180,
        notes: "Leichte Zahnfleischentzündung festgestellt",
      },
      {
        id: "treat-001-2",
        date: "2025-06-10",
        description: "Füllung Zahn 36 (Komposit)",
        dentist: "Dr. Keller",
        cost: 320,
      },
      {
        id: "treat-001-3",
        date: "2024-12-05",
        description: "Jahreskontrolle + OPG",
        dentist: "Dr. Ammann",
        cost: 250,
        notes: "Weisheitszähne unauffällig",
      },
    ],
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2025-11-20T14:30:00.000Z",
  },
  {
    id: "cust-seed-002",
    patientenNr: "P-2024-002",
    name: "Heinz Josef",
    phone: "+41 61 333 22 10",
    email: "h.josef@sunrise.ch",
    dateOfBirth: "1955-08-22",
    address: "Riehenstrasse 105, 4058 Basel",
    notes: "Teilprothese OK - regelmässige Kontrolle wichtig",
    allergies: undefined,
    lastVisit: "2026-01-15",
    insuranceType: "VVG",
    treatments: [
      {
        id: "treat-002-1",
        date: "2026-01-15",
        description: "Prothesenunterfütterung OK",
        dentist: "Dr. Ammann",
        cost: 450,
      },
      {
        id: "treat-002-2",
        date: "2025-09-08",
        description: "Parodontose-Behandlung (Quadrant 1+2)",
        dentist: "Dr. Keller",
        cost: 680,
        notes: "Nachkontrolle in 3 Monaten",
      },
      {
        id: "treat-002-3",
        date: "2025-04-20",
        description: "Kontrolluntersuchung",
        dentist: "Dr. Ammann",
        cost: 120,
      },
      {
        id: "treat-002-4",
        date: "2024-11-12",
        description: "Extraktion Zahn 47",
        dentist: "Dr. Keller",
        cost: 280,
        notes: "Komplikationsloser Verlauf",
      },
    ],
    createdAt: "2024-03-20T09:00:00.000Z",
    updatedAt: "2026-01-15T11:00:00.000Z",
  },
  {
    id: "cust-seed-003",
    patientenNr: "P-2025-003",
    name: "Sidney Muster",
    phone: "+41 78 900 55 33",
    email: "sidney.muster@gmail.com",
    dateOfBirth: "1995-12-01",
    address: "Münchensteinerstrasse 8, 4052 Basel",
    notes: "Interesse an Bleaching - beim nächsten Termin beraten",
    allergies: "Latex",
    lastVisit: "2025-08-14",
    insuranceType: "Privat",
    treatments: [
      {
        id: "treat-003-1",
        date: "2025-08-14",
        description: "Professionelle Zahnreinigung",
        dentist: "Dr. Keller",
        cost: 180,
      },
      {
        id: "treat-003-2",
        date: "2025-02-28",
        description: "Kontrolluntersuchung + OPG",
        dentist: "Dr. Ammann",
        cost: 290,
        notes: "Alles unauffällig, nächste Kontrolle in 6 Monaten",
      },
    ],
    createdAt: "2025-02-28T08:30:00.000Z",
    updatedAt: "2025-08-14T16:00:00.000Z",
  },
];

export async function POST() {
  try {
    const existing = await getCustomers();
    const existingIds = new Set(existing.map((c) => c.id));

    let added = 0;
    for (const customer of SEED_CUSTOMERS) {
      if (!existingIds.has(customer.id)) {
        await saveCustomer(customer);
        added++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `${added} Beispielpatienten hinzugefügt.`,
      total: existing.length + added,
    });
  } catch (error) {
    console.error("Error seeding customers:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen der Beispieldaten." }, { status: 500 });
  }
}
