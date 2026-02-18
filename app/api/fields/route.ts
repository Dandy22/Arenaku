// ============================================================
// app/api/fields/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Field (Lapangan) Endpoints
//
//   - POST : Menambah lapangan baru ke venue milik vendor
//   - GET  : Melihat lapangan berdasarkan venueId (publik)
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { fieldService } from "@/lib/services/field.service";

// POST /api/fields
// Header: Authorization: Bearer <token> (harus VENDOR)
// Body: { name, type, price, venueId }
// Response: data lapangan yang baru dibuat
export async function POST(req: Request) {
  try {
    // Harus login sebagai VENDOR untuk menambah lapangan
    const user = await getUserFromToken(req);
    const body = await req.json();

    // Service akan cek apakah vendor ini pemilik venue tersebut
    const field = await fieldService.createField(user.userId, user.role, {
      name: body.name,
      type: body.type,
      price: body.price,
      venueId: body.venueId,
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (
      error.message.includes("Only vendors") ||
      error.message.includes("not authorized")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/fields?venueId=xxx
// Publik — tidak perlu login
// Response: array lapangan dalam venue tertentu
export async function GET(req: Request) {
  try {
    // Ambil venueId dari query parameter: /api/fields?venueId=xxx
    const { searchParams } = new URL(req.url);
    const venueId = searchParams.get("venueId");

    if (!venueId) {
      return NextResponse.json(
        { error: "venueId query parameter is required" },
        { status: 400 }
      );
    }

    const fields = await fieldService.getFieldsByVenue(venueId);
    return NextResponse.json(fields, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}