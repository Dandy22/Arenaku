// ============================================================
// app/api/payments/webhook/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Midtrans Webhook
//
// POST /api/payments/webhook
// Dipanggil oleh Midtrans saat ada perubahan status payment.
// ============================================================

import { NextResponse } from "next/server";
import { handleMidtransWebhook, verifyMidtransSignature } from "@/lib/midtrans";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📥 Received webhook from Midtrans:", body);

    // Extract parameter dari body Midtrans
    const {
      order_id,
      transaction_status,
      transaction_id,
      status_code,
      gross_amount,
      signature_key,
    } = body;

    // Validasi required fields
    if (!order_id || !transaction_status) {
      return NextResponse.json(
        { error: "Missing required fields: order_id, transaction_status" },
        { status: 400 },
      );
    }

    // Verifikasi signature (opsional - tapi sangat direkomendasikan)
    if (signature_key && gross_amount) {
      const isValid = verifyMidtransSignature(
        signature_key,
        order_id,
        status_code,
        gross_amount,
      );

      if (!isValid) {
        console.warn("⚠️ Invalid signature_key from Midtrans webhook");
        // Untuk development, tetap lanjutkan (signature verification bisa di-disable)
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "Invalid signature" },
            { status: 403 },
          );
        }
      }
    }

    // Proses webhook
    const result = await handleMidtransWebhook({
      order_id,
      transaction_status,
      transaction_id: transaction_id || "",
      status_code: status_code || "200",
      gross_amount: gross_amount || "0",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("  Webhook processing error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// GET untuk testing - cek apakah endpoint aktif
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Midtrans webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
