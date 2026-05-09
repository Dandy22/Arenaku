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
        let snapToken = "";
        let redirectUrl = "";

        try {
          const midtransResult = await createMidtransTransaction({
            id: order.id,
            totalAmount: order.totalAmount,
            user: {
              name: order.user.name,
              email: order.user.email,
              phone: order.user.phone,
            },
          });
          snapToken = midtransResult.snapToken;
          redirectUrl = midtransResult.redirectUrl;
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
            id: order.id,
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
        id: order.id,
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

    // Security: pastikan order milik user yang request
    if (payment.order.userId !== userId) {
      throw new Error("You are not authorized to view this payment");
    }

    // Cek apakah payment sudah expired
    if (payment.status === "PENDING" && new Date() > payment.expiredAt) {
      // Auto-update ke EXPIRED jika sudah lewat waktu
      await paymentRepository.updateStatus(payment.id, "EXPIRED");
      await orderRepository.updateStatus(orderId, "CANCELLED");
      return { ...payment, status: "EXPIRED" };
    }

    return payment;
  },

  async confirmPayment(paymentId: string) {
    const { prisma } = await import("@/lib/prisma");

    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw new Error("Payment not found");

    if (payment.status !== "PENDING") {
      throw new Error(`Payment already ${payment.status}`);
    }

    await paymentRepository.updateStatus(paymentId, "SUCCESS");
    await orderRepository.updateStatus(payment.orderId, "PAID");
    const order = await orderRepository.findById(payment.orderId);

    // Trigger notifikasi Pembayaran Berhasil
    await notificationService.notifyPaymentSuccess(payment.orderId);

    // If order has event tickets, confirm them and add to EventParticipant
    if (order && order.eventTickets && order.eventTickets.length > 0) {
      for (const ticket of order.eventTickets) {
        // Update ticket status to CONFIRMED
        await prisma.eventTicket.update({
          where: { id: ticket.id },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
        });

        // Add user to event participants
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
          update: {}, // Already exists, no update needed
        });
      }

      // Trigger notifikasi Tiket Terjual
      if (order.eventTickets[0]) {
        await notificationService.notifyTicketSold(
          order.eventTickets[0].eventId,
        );
      }
    }

    return { message: "Payment confirmed successfully" };
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
    // Format simulasi QRIS — di production diganti response dari payment gateway
    return `QRIS-${orderId}-${amount}-${Date.now()}`;
  }
  // Untuk metode lain, return info rekening/instruksi
  return `${method}-${orderId}-${amount}`;
}
