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
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const field = await fieldService.createField(user.userId, user.role, {
      name: body.name,
      type: body.type,
      floorType: body.floorType,
      length: body.length,
      width: body.width,
      price: body.price,
      description: body.description,
      venueId: body.venueId,
      thumbnailUrl: body.thumbnailUrl,
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (
      error.message.includes("Only vendors") ||
      error.message.includes("not authorized") ||
      error.message.includes("not verified")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/fields?venueId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const venueId = searchParams.get("venueId");

    if (!venueId) {
      return NextResponse.json(
        { error: "venueId query parameter is required" },
        { status: 400 },
      );
    }

    const fields = await fieldService.getFieldsByVenue(venueId);
    return NextResponse.json(fields, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
