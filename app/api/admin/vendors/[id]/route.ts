// ============================================================
// app/api/admin/vendors/[id]/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Admin Vendor Action
//
//   PATCH /api/admin/vendors/[id]  → approve atau reject vendor
//
// Body: { status: "VERIFIED" | "REJECTED" }
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminService } from "@/lib/services/admin.service";

// PATCH /api/admin/vendors/[id]
// Header: Authorization: Bearer <token> (harus ADMIN)
// Body: { status: "VERIFIED" | "REJECTED" }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    // Validasi: status harus salah satu dari dua nilai ini
    if (!["VERIFIED", "REJECTED"].includes(body.status)) {
      return NextResponse.json(
        { error: "Status must be VERIFIED or REJECTED" },
        { status: 400 }
      );
    }

    const vendor = await adminService.updateVendorStatus(
      user.role,
      params.id,
      body.status
    );

    return NextResponse.json(vendor);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("Only admins")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}