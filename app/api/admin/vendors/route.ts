// ============================================================
// app/api/admin/vendors/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Admin Vendor Management
//
//   GET /api/admin/vendors           → list semua vendor
//   GET /api/admin/vendors?status=PENDING → filter by status
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminService } from "@/lib/services/admin.service";

// GET /api/admin/vendors
// GET /api/admin/vendors?status=PENDING
// Header: Authorization: Bearer <token> (harus ADMIN)
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);

    // Ambil filter status dari query param (opsional)
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "PENDING" | "VERIFIED" | "REJECTED" | null;

    const vendors = await adminService.getAllVendors(user.role, status ?? undefined);
    return NextResponse.json(vendors);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("Only admins")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}