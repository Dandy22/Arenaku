// ============================================================
// app/api/payments/[orderId]/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Payment Status
//
//   GET   /api/payments/[orderId]          → cek status payment
//   PATCH /api/payments/[orderId]/confirm  → konfirmasi bayar (simulasi)
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { paymentService } from "@/lib/services/payment.service";

// GET /api/payments/[orderId]
// Frontend polling endpoint ini tiap beberapa detik
// untuk tahu apakah QR sudah di-scan / dibayar
export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getUserFromToken(req);
    const payment = await paymentService.getPaymentStatus(user.userId, params.orderId);
    return NextResponse.json(payment);
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