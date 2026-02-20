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
    const cart = await cartService.getCart(user.userId);
    return NextResponse.json(cart);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

// POST /api/cart
// Header: Authorization: Bearer <token>
// Body: { fieldId, date, startHour, endHour }
// Response: cart item yang baru ditambahkan
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    const item = await cartService.addToCart(user.userId, user.role, {
      fieldId: body.fieldId,
      date: body.date,
      startHour: body.startHour,
      endHour: body.endHour,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("Only customers")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}