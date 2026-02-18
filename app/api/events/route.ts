// ============================================================
// app/api/events/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Event Endpoints
//
//   - POST : Membuat event baru (user harus login)
//   - GET  : Melihat semua event (publik, tidak perlu login)
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { eventService } from "@/lib/services/event.service";

// POST /api/events
// Header: Authorization: Bearer <token>
// Body: { title, description, location, date, startHour, endHour, ticketPrice, capacity }
// Response: data event yang baru dibuat
export async function POST(req: Request) {
  try {
    // Harus login untuk membuat event
    const user = await getUserFromToken(req);
    const body = await req.json();

    const event = await eventService.createEvent(user.userId, {
      title: body.title,
      description: body.description,
      location: body.location,
      date: body.date,
      startHour: body.startHour,
      endHour: body.endHour,
      ticketPrice: body.ticketPrice,
      capacity: body.capacity,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/events
// Publik — tidak butuh autentikasi
// Response: array semua event yang tersedia
export async function GET() {
  try {
    const events = await eventService.getAllEvents();
    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}