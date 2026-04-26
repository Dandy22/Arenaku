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
// Body: { title, description, location, city?, category?, imageUrl?,
//         date, startHour, endHour, ticketPrice, capacity,
//         additionalInfo?, termsConditions?,
//         contactName?, contactEmail?, contactPhone?,
//         latitude?, longitude? }
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    const event = await eventService.createEvent(user.userId, {
      title: body.title,
      description: body.description,
      location: body.location,
      city: body.city,
      category: body.category,
      imageUrl: body.imageUrl,
      date: body.date,
      startHour: body.startHour,
      endHour: body.endHour,
      ticketPrice: body.ticketPrice,
      capacity: body.capacity,
      additionalInfo: body.additionalInfo,
      termsConditions: body.termsConditions,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      latitude: body.latitude,
      longitude: body.longitude,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/events?category=FUTSAL&city=Jakarta&page=1&limit=8
// Publik — tidak butuh autentikasi
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const result = await eventService.getAllEvents({
      category: searchParams.get("category") || undefined,
      city: searchParams.get("city") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 8,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}