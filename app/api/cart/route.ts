// ============================================================
// app/api/cart/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Cart Endpoints
//
//   GET  /api/cart       → lihat isi cart
//   POST /api/cart       → tambah item ke cart
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { cartService } from "@/lib/services/cart.service";

// GET /api/cart
// Header: Authorization: Bearer <token>
// Response: array cart items milik user
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const cart = await cartService.getCart(user.userId);
    return NextResponse.json(cart);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch cart";
    if (errorMessage.includes("token")) {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}

// POST /api/cart
// Header: Authorization: Bearer <token>
// Body for field booking: { fieldId, date, startHour, endHour }
// Body for event ticket: { eventId, quantity }
// Response: cart item yang baru ditambahkan
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);

    // 1. VALIDASI USER HARUS PALING AWAL
    // Pastikan user ada DAN user.userId terdefinisi dengan jelas
    if (!user || !user.userId) {
      console.error(
        "[POST /cart] Unauthorized access attempt or missing userId in token payload",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. PARSE BODY SETELAH USER VALID
    const body = await req.json();

    let item;

    // Check if this is an event ticket purchase
    if (body.eventId) {
      item = await cartService.addEventToCart(user.userId, user.role, {
        eventId: body.eventId,
        ticketTierId: body.ticketTierId,
        quantity: body.quantity || 1,
      });
    } else {
      // Field booking
      item = await cartService.addToCart(user.userId, user.role, {
        fieldId: body.fieldId,
        date: body.date,
        startHour: body.startHour,
        endHour: body.endHour,
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[POST /cart] Error:", error); // Tambahkan log ini buat tracking di production
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("token")) {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    if (errorMessage.includes("Only customers")) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
