// ============================================================
// app/api/payments/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Payment Endpoints
//
//   POST /api/payments  → buat payment + generate QR code
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { paymentService } from "@/lib/services/payment.service";

// POST /api/payments
// Header: Authorization: Bearer <token>
// Body: { orderId, method }
// Response: payment object dengan qrCode di dalamnya
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    if (!body.orderId || !body.method) {
      return NextResponse.json(
        { error: "orderId and method are required" },
        { status: 400 }
      );
    }

    const payment = await paymentService.createPayment(user.userId, {
      orderId: body.orderId,
      method: body.method,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("not authorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}