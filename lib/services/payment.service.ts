// ============================================================
// lib/services/payment.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic Layer: Payment Service
//
// Payment dibuat setelah user pilih metode bayar.
// Menggunakan Midtrans SNAP (sandbox) sebagai payment gateway.
// ============================================================

import { paymentRepository } from "@/lib/repositories/payment.repository";
import { orderRepository } from "@/lib/repositories/order.repository";
import { createMidtransTransaction, getMidtransConfig } from "@/lib/midtrans";
import { notificationService } from "@/lib/services/notification.service";

// Durasi expired payment: 15 menit
const PAYMENT_EXPIRY_MINUTES = 15;

export const paymentService = {
  async createPayment(
    userId: string,
    data: {
      orderId: string;
      method: string;
    },
  ) {
    const validMethods = ["QRIS", "BANK_TRANSFER", "E_WALLET"];
    if (!validMethods.includes(data.method)) {
      throw new Error(
        `Invalid payment method. Choose: ${validMethods.join(", ")}`,
      );
    }

    const order = await orderRepository.findById(data.orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) {
      throw new Error("You are not authorized to pay this order");
    }

    const now = new Date();
    const currentPayment = order.payment;

    if (currentPayment) {
      const isStillPending =
        currentPayment.status === "PENDING" && currentPayment.expiredAt > now;
      const isRetryable =
        ["FAILED", "EXPIRED"].includes(currentPayment.status) ||
        (currentPayment.status === "PENDING" &&
          currentPayment.expiredAt <= now);

      if (isStillPending) {
        if (currentPayment.snapToken) {
          return {
            ...currentPayment,
            snapToken: currentPayment.snapToken,
            redirectUrl: currentPayment.qrCode,
            midtransConfig: getMidtransConfig(),
          };
        }

        // Fallback jika karena alasan tertentu token tidak ada di DB
        let snapToken = "";
        let redirectUrl = "";
        try {
          const midtransResult = await createMidtransTransaction({
            id: `${order.id}-${Date.now()}`,
            totalAmount: order.totalAmount,
            user: {
              name: order.user.name,
              email: order.user.email,
              phone: order.user.phone,
            },
          });
          snapToken = midtransResult.snapToken;
          redirectUrl = midtransResult.redirectUrl;

          // Update DB dengan snapToken yang baru didapat
          await paymentRepository.update(currentPayment.id, {
            snapToken,
            qrCode: redirectUrl,
          });
        } catch (error: any) {
          console.warn(
            "⚠️ Midtrans unavailable, using simulation:",
            error.message,
          );
        }

        return {
          ...currentPayment,
          snapToken,
          redirectUrl,
          midtransConfig: getMidtransConfig(),
        };
      }

      if (isRetryable) {
        if (order.status !== "PENDING") {
          throw new Error(
            `Cannot create payment for order with status: ${order.status}`,
          );
        }

        const expiredAt = new Date();
        expiredAt.setMinutes(expiredAt.getMinutes() + PAYMENT_EXPIRY_MINUTES);

        let snapToken = "";
        let redirectUrl = "";
        let qrCode = "";

        try {
          const midtransResult = await createMidtransTransaction({
            id: `${order.id}-${Date.now()}`,
            totalAmount: order.totalAmount,
            user: {
              name: order.user.name,
              email: order.user.email,
              phone: order.user.phone,
            },
          });
          snapToken = midtransResult.snapToken;
          redirectUrl = midtransResult.redirectUrl;
          qrCode = redirectUrl;
        } catch (error: any) {
          console.warn(
            "⚠️ Midtrans unavailable, using simulation:",
            error.message,
          );
          qrCode = generateQRCode(data.orderId, order.totalAmount, data.method);
        }

        const payment = await paymentRepository.update(currentPayment.id, {
          method: data.method,
          qrCode,
          snapToken, // Simpan token
          expiredAt,
          status: "PENDING",
          paidAt: null,
        });

        return {
          ...payment,
          snapToken,
          redirectUrl,
          midtransConfig: getMidtransConfig(),
        };
      }

      throw new Error("Payment already exists for this order");
    }

    if (order.status !== "PENDING") {
      throw new Error(
        `Cannot create payment for order with status: ${order.status}`,
      );
    }

    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + PAYMENT_EXPIRY_MINUTES);

    let snapToken = "";
    let redirectUrl = "";
    let qrCode = "";

    try {
      const midtransResult = await createMidtransTransaction({
        id: `${order.id}-${Date.now()}`,
        totalAmount: order.totalAmount,
        user: {
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        },
      });
      snapToken = midtransResult.snapToken;
      redirectUrl = midtransResult.redirectUrl;
      qrCode = redirectUrl;
    } catch (error: any) {
      console.warn("⚠️ Midtrans unavailable, using simulation:", error.message);
      qrCode = generateQRCode(data.orderId, order.totalAmount, data.method);
    }

    const payment = await paymentRepository.create({
      orderId: data.orderId,
      amount: order.totalAmount,
      method: data.method,
      qrCode,
      snapToken, // Simpan token
      expiredAt,
    });

    return {
      ...payment,
      snapToken,
      redirectUrl,
      midtransConfig: getMidtransConfig(),
    };
  },

  async getPaymentStatus(userId: string, orderId: string) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new Error("Payment not found");

    if (payment.order.userId !== userId) {
      throw new Error("You are not authorized to view this payment");
    }

    if (payment.status === "PENDING" && new Date() > payment.expiredAt) {
      await paymentRepository.updateStatus(payment.id, "EXPIRED");
      await orderRepository.updateStatus(orderId, "CANCELLED");
      return { ...payment, status: "EXPIRED" };
    }

    return payment;
  },

  // Ubah parameter menjadi orderId
  async confirmPayment(orderId: string) {
    const { prisma } = await import("@/lib/prisma");

    // 1. Ambil order dengan relasi lengkap sampai ke venue untuk dapet vendorId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        items: { include: { field: { include: { venue: true } } } },
        eventTickets: true,
      },
    });

    if (!order) throw new Error("Order not found");
    if (order.status === "PAID") throw new Error("Payment already processed");

    const payment = order.payment;
    if (!payment) throw new Error("Payment record not found");

    // Ambil vendorId dari item pertama (asumsi satu order satu vendor)
    const vendorId = order.items[0]?.field?.venue?.vendorId;
    if (!vendorId) throw new Error("Vendor not found for this order");

    // 2. Gunakan Transaction agar semua data terupdate dengan aman
    await prisma.$transaction(async (tx) => {
      // Update status payment
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS", paidAt: new Date() },
      });

      // Update status order
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      // 🔥 KUNCI UTAMA: Tambahkan saldo ke vendor
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          balance: { increment: order.totalAmount },
        },
      });

      // Handle Event Tickets (jika ada)
      if (order.eventTickets && order.eventTickets.length > 0) {
        for (const ticket of order.eventTickets) {
          await tx.eventTicket.update({
            where: { id: ticket.id },
            data: { status: "CONFIRMED", confirmedAt: new Date() },
          });

          await tx.eventParticipant.upsert({
            where: {
              eventId_userId: {
                eventId: ticket.eventId,
                userId: ticket.userId,
              },
            },
            create: { eventId: ticket.eventId, userId: ticket.userId },
            update: {},
          });
        }
      }
    });

    // Trigger notifikasi setelah transaksi sukses
    await notificationService.notifyPaymentSuccess(orderId);

    // Notify jika ada event
    if (order.eventTickets && order.eventTickets.length > 0) {
      await notificationService.notifyTicketSold(order.eventTickets[0].eventId);
    }

    return { message: "Payment confirmed and balance updated" };
  },
};

// ----------------------------------------------------------
// generateQRCode (fallback helper)
// Simulasi generate QR code string.
// Dipakai jika Midtrans unavailable.
// ----------------------------------------------------------
function generateQRCode(
  orderId: string,
  amount: number,
  method: string,
): string {
  if (method === "QRIS") {
    return `QRIS-${orderId}-${amount}-${Date.now()}`;
  }
  return `${method}-${orderId}-${amount}`;
}
