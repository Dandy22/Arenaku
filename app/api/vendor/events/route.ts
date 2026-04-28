// ============================================================
// app/api/vendor/events/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Vendor Event Management
//
//   - GET  : Get vendor's events
//   - POST : Create new event (vendor only)
// ============================================================
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { eventService } from "@/lib/services/event.service";

// GET /api/vendor/events
// Header: Authorization: Bearer <token>
// Response: Array of vendor's events
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);

    if (user.role !== "VENDOR") {
      return NextResponse.json({ error: "Only vendors can access this" }, { status: 403 });
    }

    const events = await eventService.getVendorEvents(user.userId);
    return NextResponse.json(events);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/vendor/events
// Header: Authorization: Bearer <token>
// Body: { title, description, location, city?, district?, category?, imageUrl?,
//         date, startHour, endHour, ticketPrice, capacity,
//         additionalInfo?, termsConditions?,
//         contactName?, contactEmail?, contactPhone?,
//         latitude?, longitude? }
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    const event = await eventService.createEvent(user.userId, user.role, {
      title: body.title,
      description: body.description,
      location: body.location,
      city: body.city,
      district: body.district,
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