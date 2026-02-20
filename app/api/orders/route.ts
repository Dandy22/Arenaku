// ============================================================
// app/api/orders/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Order Endpoints
//
//   POST /api/orders  → checkout (buat order dari cart)
//   GET  /api/orders  → riwayat order user
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { orderService } from "@/lib/services/order.service";

// POST /api/orders
// Header: Authorization: Bearer <token>
// Body: { customerName, customerPhone, customerEmail, notes? }
// Response: order yang baru dibuat beserta semua item-nya
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    const order = await orderService.createOrder(user.userId, user.role, {
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      notes: body.notes,
    });

    return NextResponse.json(order, { status: 201 });
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

// GET /api/orders
// Header: Authorization: Bearer <token>
// Response: semua order milik user
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const orders = await orderService.getUserOrders(user.userId);
    return NextResponse.json(orders);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}