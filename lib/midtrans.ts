// ============================================================
// lib/midtrans.ts
// ------------------------------------------------------------
// Midtrans SNAP Integration Helper
//
// Fungsi helper untuk:
// - Membuat transaksi ke Midtrans
// - Memproses webhook dari Midtrans
// ============================================================

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Konfigurasi Midtrans dari environment
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
const isProduction = process.env.NODE_ENV === "production";

// Base URL Midtrans (sandbox vs production)
const MIDTRANS_BASE_URL = isProduction
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

// ============================================================
// createMidtransTransaction
// Membuat Snap Token via Midtrans API
// ============================================================
export async function createMidtransTransaction(order: {
  id: string;
  totalAmount: number;
  user: { name: string; email: string; phone: string };
}) {
  const transactionDetails = {
    order_id: order.id,
    gross_amount: order.totalAmount,
  };

  const customerDetails = {
    first_name: order.user.name.split(" ")[0],
    last_name: order.user.name.split(" ").slice(1).join(" ") || "",
    email: order.user.email,
    phone: order.user.phone,
  };

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const payload = {
    transaction_details: transactionDetails,
    customer_details: customerDetails,
    credit_card: {
      secure: true,
    },
    notification_url: `${appBaseUrl.replace(/\/$/, "")}/api/payments/webhook`,
  };

  // Encode untuk Basic Auth
  const auth = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");

  try {
    const response = await fetch(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Midtrans API Error:", result);
      throw new Error(
        result.status_message || "Failed to create Midtrans transaction",
      );
    }

    // Return snap token dan redirect URL
    return {
      snapToken: result.token,
      redirectUrl: result.redirect_url,
      orderId: order.id,
    };
  } catch (error) {
    console.error("❌ createMidtransTransaction error:", error);
    throw error;
  }
}

// ============================================================
// handleMidtransWebhook
// Memproses notifikasi payment dari Midtrans
// ============================================================
export async function handleMidtransWebhook(payload: {
  order_id: string;
  transaction_status: string;
  transaction_id: string;
  status_code: string;
  gross_amount: string;
}) {
  const { order_id, transaction_status, transaction_id, gross_amount } =
    payload;

  console.log("📥 Midtrans Webhook received:", {
    orderId: order_id,
    transactionStatus: transaction_status,
    transactionId: transaction_id,
  });

  // Ambil payment berdasarkan order_id
  // Di dalam fungsi handleMidtransWebhook, bagian query payment:

  const payment = await prisma.payment.findUnique({
    where: { orderId: order_id },
    include: {
      order: {
        include: {
          user: true,
          eventTickets: true,
          items: {
            include: {
              field: {
                include: {
                  venue: true, // Di sini sudah ada vendorId di model Venue
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    console.error("❌ Payment not found for order:", order_id);
    return { status: "error", message: "Payment not found" };
  }

  // Mapping status Midtrans ke status kita
  let newPaymentStatus: "SUCCESS" | "FAILED" | "EXPIRED" | "PENDING" =
    "PENDING";
  let newOrderStatus: "PAID" | "CANCELLED" | "PENDING" = "PENDING";

  // Status yang berarti berhasil
  if (transaction_status === "settlement" || transaction_status === "capture") {
    newPaymentStatus = "SUCCESS";
    newOrderStatus = "PAID";

    // PERBAIKAN: Bungkus proses payout dengan try-catch
    try {
      await processVendorPayout(payment, parseInt(gross_amount));
    } catch (err) {
      console.error("Gagal melakukan payout ke vendor:", err);
    }
  }
  // Status yang berarti gagal
  else if (transaction_status === "expire") {
    newPaymentStatus = "EXPIRED";
    newOrderStatus = "CANCELLED";
  } else if (transaction_status === "cancel" || transaction_status === "deny") {
    newPaymentStatus = "FAILED";
    newOrderStatus = "CANCELLED";
  } else {
    // Status lain (pending, challenge, dll) - tidak ubah status
    console.log("ℹ️ Unhandled transaction_status:", transaction_status);
    return { status: "ok", message: "Status processed" };
  }

  // Update payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newPaymentStatus,
      paidAt: newPaymentStatus === "SUCCESS" ? new Date() : undefined,
    },
  });

  // Update order - gunakan payment.order.id bukan order_id dari payload
  await prisma.order.update({
    where: { id: payment.order.id },
    data: { status: newOrderStatus },
  });

  // Cancel event tickets jika payment gagal/expired
  if (newPaymentStatus !== "SUCCESS" && payment.order.eventTickets) {
    try {
      await prisma.eventTicket.updateMany({
        where: {
          id: { in: payment.order.eventTickets.map((t) => t.id) },
        },
        data: { status: "CANCELLED" },
      });
    } catch (err) {
      console.error("Gagal membatalkan event tickets:", err);
    }
  }

  // Jika SUCCESS, konfirmasi event tickets
  if (newPaymentStatus === "SUCCESS" && payment.order.eventTickets) {
    // PERBAIKAN: Bungkus dengan try-catch agar webhook tidak crash
    try {
      for (const ticket of payment.order.eventTickets) {
        await prisma.eventTicket.update({
          where: { id: ticket.id },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
        });

        // Tambah ke participants
        await prisma.eventParticipant.upsert({
          where: {
            eventId_userId: {
              eventId: ticket.eventId,
              userId: ticket.userId,
            },
          },
          create: {
            eventId: ticket.eventId,
            userId: ticket.userId,
          },
          update: {},
        });
      }
    } catch (err) {
      console.error("Gagal mengkonfirmasi event tickets:", err);
    }
  }

  console.log("✅ Webhook processed:", {
    orderId: order_id,
    paymentStatus: newPaymentStatus,
    orderStatus: newOrderStatus,
  });

  return { status: "ok", message: "Webhook processed" };
}

// ============================================================
// processVendorPayout
// Hitung & tambahkan saldo ke vendor (90% - 10%)
// ============================================================
// lib/midtrans.ts

async function processVendorPayout(
  payment: {
    orderId: string;
    order?: {
      items?: Array<{
        field?: {
          venue?: {
            vendorId: string;
          };
        };
      }>;
    };
  },
  total: number,
) {
  // Hitung pembagian (90% Vendor, 10% Platform)
  const platformFee = Math.floor(total * 0.1);
  const vendorAmount = total - platformFee;

  console.log("💰 Processing vendor payout:", {
    orderId: payment.orderId,
    total,
    platformFee,
    vendorAmount,
  });

  // Ambil vendorId dari relasi baru: order -> items -> field -> venue -> vendorId
  // (Pastikan field venue.vendorId merujuk ke ID model Vendor)
  const vendorId = payment.order.items?.[0]?.field?.venue?.vendorId;

  if (!vendorId) {
    console.error("❌ Vendor ID not found for order:", payment.orderId);
    return;
  }

  // UPDATE SALDO VENDOR (Ganti vendorProfile menjadi vendor)
  const updatedVendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      balance: {
        increment: vendorAmount,
      },
    },
  });

  console.log("✅ Vendor payout completed:", {
    vendorId: vendorId,
    vendorName: updatedVendor.name,
    amountAdded: vendorAmount,
    newBalance: updatedVendor.balance,
  });
}

// ============================================================
// verifyMidtransSignature
// Verifikasi signature dari webhook (security)
// ============================================================
export function verifyMidtransSignature(
  signatureKey: string,
  orderId: string,
  statusCode: string,
  grossAmount: string,
): boolean {
  // Buat signature dari parameter
  const dataToHash = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
  const generatedSignature = crypto
    .createHash("sha512")
    .update(dataToHash)
    .digest("hex");

  return generatedSignature === signatureKey;
}

// ============================================================
// getMidtransConfig
// Get public config untuk frontend
// ============================================================
export function getMidtransConfig() {
  return {
    clientKey: MIDTRANS_CLIENT_KEY,
    isProduction,
  };
}
