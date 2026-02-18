// ============================================================
// app/api/venues/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Venue Endpoints
//
//   - POST : Membuat venue baru (hanya VENDOR)
//   - GET  : Melihat semua venue (publik) atau venue milik vendor
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { venueService } from "@/lib/services/venue.service";

// POST /api/venues
// Header: Authorization: Bearer <token> (harus VENDOR)
// Body: { name, description, city }
// Response: data venue yang baru dibuat
export async function POST(req: Request) {
  try {
    // Harus login sebagai VENDOR
    const user = await getUserFromToken(req);
    const body = await req.json();

    const venue = await venueService.createVenue(user.userId, user.role, {
      name: body.name,
      description: body.description,
      city: body.city,
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("Only vendors")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/venues
// Publik (tanpa token) → kembalikan semua venue
// Dengan token VENDOR   → kembalikan venue milik vendor tsb
export async function GET(req: Request) {
  try {
    // Coba ambil token — jika ada dan valid, kembalikan venue milik vendor itu
    // Jika tidak ada token, kembalikan semua venue (mode publik)
    try {
      const user = await getUserFromToken(req);

      if (user.role === "VENDOR") {
        // Vendor melihat venue miliknya sendiri (dashboard vendor)
        const myVenues = await venueService.getVendorVenues(user.userId, user.role);
        return NextResponse.json(myVenues, { status: 200 });
      }
    } catch {
      // Tidak ada token / token tidak valid → lanjut ke mode publik
    }

    // Mode publik: kembalikan semua venue yang tersedia
    const allVenues = await venueService.getAllVenues();
    return NextResponse.json(allVenues, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 });
  }
}