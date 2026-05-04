import { NextRequest, NextResponse } from "next/server";
import { getCustomers, saveCustomer, deleteCustomer } from "@/lib/store";
import { Customer } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    let customers = await getCustomers();

    if (query) {
      const lower = query.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.patientenNr.toLowerCase().includes(lower) ||
          (c.phone && c.phone.includes(query)) ||
          (c.email && c.email.toLowerCase().includes(lower))
      );
    }

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Kunden." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const customer: Customer = {
      id: `cust-${Date.now()}`,
      patientenNr: body.patientenNr || `P-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      name: body.name,
      phone: body.phone,
      email: body.email,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      notes: body.notes,
      allergies: body.allergies,
      lastVisit: body.lastVisit,
      insuranceType: body.insuranceType,
      treatments: body.treatments || [],
      createdAt: now,
      updatedAt: now,
    };

    await saveCustomer(customer);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id erforderlich." }, { status: 400 });
    }

    const customers = await getCustomers();
    const customer = customers.find((c) => c.id === id);

    if (!customer) {
      return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
    }

    await saveCustomer({ ...customer, ...updates });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id erforderlich." }, { status: 400 });
    }

    await deleteCustomer(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Fehler beim Löschen." }, { status: 500 });
  }
}
