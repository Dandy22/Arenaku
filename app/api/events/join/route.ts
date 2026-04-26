// ============================================================
// app/api/events/join/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Join Event Endpoint
//
//   - POST : Mendaftarkan user yang login ke sebuah event
//
// Validasi (event ada, kapasitas, duplikat) semua ada di eventService.
// ============================================================
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { eventService } from "@/lib/services/event.service";

// POST /api/events/join
// Header: Authorization: Bearer <token>
// Body: { eventId: string }
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    if (!body.eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const result = await eventService.joinEvent(user.userId, body.eventId);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === "Event not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}