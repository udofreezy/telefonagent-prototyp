import { NextResponse } from "next/server";
import { getCallStatus, saveCallStatus } from "@/lib/store";

export async function GET() {
  const status = await getCallStatus();
  return NextResponse.json(status);
}

// POST to dismiss/clear the latest call notification
export async function POST() {
  await saveCallStatus({ active: false });
  return NextResponse.json({ ok: true });
}
