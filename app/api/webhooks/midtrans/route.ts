// ============================================================
// app/api/webhooks/midtrans/route.ts
// ------------------------------------------------------------
// Webhook handler untuk menerima callback dari Midtrans.
// Ini akan mengupdate status payment dan order, serta
// memicu notifikasi yang sesuai.
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification.service";

// Midtrans webhook signature header
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_IS_PRODUCTION =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("[Webhook] Received Midtrans callback:", {
      orderId: body.order_id,
      statusCode: body.status_code,
      transactionStatus: body.transaction_status,
    });

    const orderId = body.order_id.split("-")[0];
    const transactionStatus = body.transaction_status;
    const statusCode = body.status_code;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    // Find the payment associated with this order
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            user: true,
            items: {
              include: {
                field: {
                  include: {
                    venue: {
                      include: {
                        vendor: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      console.error("[Webhook] Payment not found for order:", orderId);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Process based on transaction status
    switch (transactionStatus) {
      case "settlement":
      case "success":
        // Payment successful
        if (payment.status !== "SUCCESS") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "SUCCESS" },
          });

          // Gunakan payment.order.id bukan orderId dari payload
          await prisma.order.update({
            where: { id: payment.order.id },
            data: { status: "PAID" },
          });

          // PERBAIKAN: Bungkus dengan try-catch agar webhook tidak crash
          try {
            await notificationService.notifyPaymentSuccess(orderId);
          } catch (notifErr) {
            console.error(
              "[Webhook] Gagal mengirim notifikasi sukses:",
              notifErr,
            );
          }

          console.log("[Webhook] Payment confirmed for order:", orderId);
        }
        break;

      case "deny":
      case "refund":
      case "partial_refund":
        // Payment failed or refunded
        if (payment.status !== "FAILED") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          });

          // Gunakan payment.order.id bukan orderId dari payload
          await prisma.order.update({
            where: { id: payment.order.id },
            data: { status: "CANCELLED" },
          });

          // PERBAIKAN: Bungkus dengan try-catch agar webhook tidak crash
          try {
            await notificationService.notifyPaymentFailed(orderId);
          } catch (notifErr) {
            console.error(
              "[Webhook] Gagal mengirim notifikasi gagal:",
              notifErr,
            );
          }

          console.log("[Webhook] Payment failed for order:", orderId);
        }
        break;

      case "expire":
        // Payment expired
        if (payment.status !== "EXPIRED") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "EXPIRED" },
          });

          // Gunakan payment.order.id bukan orderId dari payload
          await prisma.order.update({
            where: { id: payment.order.id },
            data: { status: "CANCELLED" },
          });

          // PERBAIKAN: Bungkus dengan try-catch agar webhook tidak crash
          try {
            await notificationService.notifyOrderCancelled(
              orderId,
              "Pembayaran kedaluwarsa",
            );
          } catch (notifErr) {
            console.error(
              "[Webhook] Gagal mengirim notifikasi expired:",
              notifErr,
            );
          }

          console.log("[Webhook] Payment expired for order:", orderId);
        }
        break;

      case "pending":
        // Payment is pending, no action needed
        console.log("[Webhook] Payment pending for order:", orderId);
        break;

      default:
        console.log("[Webhook] Unknown transaction status:", transactionStatus);
    }

    return NextResponse.json(
      { success: true, message: "Webhook processed" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET method for testing webhook endpoint
export async function GET() {
  return NextResponse.json(
    {
      message: "Midtrans webhook endpoint is active",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
