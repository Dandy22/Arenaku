// ============================================================
// app/api/vendor/bookings/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Vendor Booking Monitor
//
//   GET /api/vendor/bookings  → semua order masuk ke venue vendor
//
// Vendor bisa lihat siapa yang booking lapangan mereka
// beserta detail waktu dan status pembayaran.
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/vendor/bookings
// Header: Authorization: Bearer <token> (harus VENDOR)
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);

    if (user.role !== "VENDOR") {
      return NextResponse.json(
        { error: "Only vendors can access this endpoint" },
        { status: 403 }
      );
    }

    // Ambil VendorProfile dulu untuk dapat ID vendor
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!vendorProfile) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    // Ambil semua OrderItem yang lapangannya milik vendor ini
    // Relasi: OrderItem → Field → Venue → VendorProfile
    const orderItems = await prisma.orderItem.findMany({
      where: {
        field: {
          venue: {
            vendorId: vendorProfile.id,
          },
        },
      },
      include: {
        field: {
          include: { venue: true },
        },
        order: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
            payment: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(orderItems);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}