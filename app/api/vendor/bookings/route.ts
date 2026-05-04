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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "VENDOR") {
      return NextResponse.json(
        { error: "Only vendors can access this endpoint" },
        { status: 403 },
      );
    }

    // 1. Cari membership vendor user ini (Struktur Baru)
    const membership = await prisma.vendorMember.findFirst({
      where: { userId: user.userId },
      select: { vendorId: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Anda tidak terdaftar di vendor manapun" },
        { status: 404 },
      );
    }

    // 2. Ambil semua OrderItem yang lapangannya milik vendor ini
    // Relasi baru: OrderItem → Field → Venue → Vendor (id)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        field: {
          venue: {
            vendorId: membership.vendorId, // Menggunakan ID dari tabel Vendor
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
    console.error("Vendor Bookings Error:", error);
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}
