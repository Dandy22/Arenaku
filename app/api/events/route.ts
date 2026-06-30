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

/**
 * POST /api/events
 * Membuat event baru atau menyimpan draf
 */
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Meneruskan semua field termasuk status (DRAFT/ACTIVE) ke service
    const event = await eventService.createEvent(user.userId, user.role, {
      title: body.title,
      description: body.description,
      location: body.location,
      city: body.city,
      district: body.district,
      category: body.category,
      topic: body.topic,
      imageUrl: body.imageUrl,
      date: body.date,
      endDate: body.endDate || body.date, // Fallback jika endDate kosong
      startHour: body.startHour,
      endHour: body.endHour,
      capacity: Number(body.capacity) || 0,
      additionalInfo: body.additionalInfo,
      termsConditions: body.termsConditions,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      latitude: body.latitude,
      longitude: body.longitude,
      status: body.status || "ACTIVE", // Default ke ACTIVE jika status tidak dikirim
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("POST Event Error:", error);
    // Handle error token expired atau lainnya
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * GET /api/events
 * Mengambil daftar event berdasarkan filter dan role
 */
/**
 * GET /api/events
 * Mengambil daftar event berdasarkan filter dan role
 */
export async function GET(req: Request) {
  try {
    let user = null;
    try {
      user = await getUserFromToken(req);
    } catch (e) {
      // Abaikan jika tidak ada token (akses publik)
    }

    const { searchParams } = new URL(req.url);
    const nameParam = searchParams.get("name") || undefined;
    const categoryParam = searchParams.get("category") || undefined;
    const eventTypeParam = searchParams.get("eventType") || undefined;
    const districtParam = searchParams.get("district") || undefined;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : 1;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 8;

    // 1. LOGIKA UNTUK VENDOR (Owner & Staff)
    // PERBAIKAN: Sekarang data Vendor akan ikut disaring sesuai input filter dari Frontend
    if (user && user.role === "VENDOR") {
      let vendorEvents = await eventService.getVendorEvents(user.userId);

      // Filter berdasarkan kategori olahraga (Basket, Badminton, dll)
      if (categoryParam) {
        vendorEvents = vendorEvents.filter(
          (e: any) =>
            (e.topic &&
              e.topic.toLowerCase().includes(categoryParam.toLowerCase())) ||
            (e.category &&
              e.category.toLowerCase().includes(categoryParam.toLowerCase())),
        );
      }

      // Filter berdasarkan tipe event (Turnamen / Olahraga)
      if (eventTypeParam) {
        const mappedType =
          eventTypeParam === "TURNAMEN"
            ? "TOURNAMENT"
            : eventTypeParam === "OLAHRAGA"
              ? "SPORTS"
              : eventTypeParam;
        vendorEvents = vendorEvents.filter(
          (e: any) =>
            (e.category &&
              e.category.toLowerCase().includes(mappedType.toLowerCase())) ||
            (e.topic &&
              e.topic.toLowerCase().includes(mappedType.toLowerCase())),
        );
      }

      // Filter berdasarkan judul atau kata kunci nama
      if (nameParam) {
        vendorEvents = vendorEvents.filter(
          (e: any) =>
            (e.title &&
              e.title.toLowerCase().includes(nameParam.toLowerCase())) ||
            (e.location &&
              e.location.toLowerCase().includes(nameParam.toLowerCase())) ||
            (e.topic &&
              e.topic.toLowerCase().includes(nameParam.toLowerCase())),
        );
      }

      // Filter berdasarkan Kecamatan
      if (districtParam) {
        vendorEvents = vendorEvents.filter(
          (e: any) =>
            e.district &&
            e.district.toLowerCase().includes(districtParam.toLowerCase()),
        );
      }

      const total = vendorEvents.length;
      const skip = (page - 1) * limit;
      const paginatedData = vendorEvents.slice(skip, skip + limit);

      return NextResponse.json({
        data: paginatedData,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    }

    // 2. LOGIKA UNTUK PUBLIK / CUSTOMER
    const result = await eventService.getAllEvents({
      name: nameParam,
      category: categoryParam,
      eventType: eventTypeParam,
      city: searchParams.get("city") || undefined,
      district: districtParam,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET Events Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
