// app/api/admin/events/route.ts

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { eventService } from "@/lib/services/event.service";

// GET /api/admin/events
// Ambil semua event untuk dashboard admin
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can access this" },
        { status: 403 },
      );
    }

    const events = await eventService.getAdminEvents();
    return NextResponse.json(events);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/events
// Biar Admin bisa bikin event baru atau simpan draf
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const event = await eventService.createEvent(user.userId, user.role, {
      title: body.title,
      description: body.description,
      location: body.location,
      city: body.city || "Kota Bekasi",
      district: body.district,
      category: body.category,
      topic: body.topic,
      imageUrl: body.imageUrl,
      date: body.date,
      endDate: body.endDate || body.date,
      startHour: body.startHour,
      endHour: body.endHour,
      ticketPrice: Number(body.ticketPrice) || 0,
      capacity: Number(body.capacity) || 0,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      status: body.status, // <--- INI PENTING: Biar draf lu gak berubah jadi ACTIVE otomatis
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
