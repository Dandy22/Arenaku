// ============================================================
// app/api/orders/[id]/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Order Detail
//
//   GET /api/orders/[id]  → detail satu order (halaman periksa pesanan)
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { orderService } from "@/lib/services/order.service";

// GET /api/orders/[id]
// Header: Authorization: Bearer <token>
// Response: detail order lengkap + items + payment (kalau ada)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req);
    const order = await orderService.getOrderById(user.userId, params.id);
    return NextResponse.json(order);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("not authorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}