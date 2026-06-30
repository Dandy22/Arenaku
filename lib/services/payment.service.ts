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

    // 🔥 FIX: Handle free orders (totalAmount = 0)
    if (order.totalAmount === 0) {
      // For free orders, auto-confirm payment
      const expiredAt = new Date();
      expiredAt.setMinutes(expiredAt.getMinutes() + PAYMENT_EXPIRY_MINUTES);

      let payment;

      if (currentPayment) {
        // Payment record already exists, update it to SUCCESS
        payment = await paymentRepository.update(currentPayment.id, {
          method: data.method,
          qrCode: "FREE_ORDER",
          snapToken: "",
          expiredAt,
          status: "SUCCESS",
          paidAt: new Date(),
        });
      } else {
        // Create payment record with SUCCESS status immediately
        try {
          payment = await paymentRepository.create({
            orderId: data.orderId,
            amount: 0,
            method: data.method,
            qrCode: "FREE_ORDER",
            snapToken: "",
            expiredAt,
          });

          // Update payment status to SUCCESS
          payment = await paymentRepository.updateStatus(payment.id, "SUCCESS");
        } catch (createError: any) {
          // If Unique constraint error, payment already exists (race condition)
          // Load existing payment and update it
          if (createError.code === "P2002") {
            const existingPayment = await paymentRepository.findByOrderId(
              data.orderId,
            );
            if (existingPayment) {
              payment = await paymentRepository.update(existingPayment.id, {
                method: data.method,
                qrCode: "FREE_ORDER",
                snapToken: "",
                expiredAt,
                status: "SUCCESS",
                paidAt: new Date(),
              });
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }

      // Confirm the payment (update order to PAID + other logistics)
      // Only call if payment is not already SUCCESS (prevent double confirmation)
      if (payment.status !== "SUCCESS") {
        await this.confirmPayment(data.orderId);
      } else if (order.status !== "PAID") {
        // Payment SUCCESS but order not PAID yet, confirm it
        await this.confirmPayment(data.orderId);
      }

      return {
        ...payment,
        snapToken: "",
        redirectUrl: "",
        midtransConfig: getMidtransConfig(),
      };
    }

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

    // 🔥 FIX: If order already PAID, just return success (idempotent)
    if (order.status === "PAID") {
      return { message: "Payment already confirmed and processed" };
    }

    const payment = order.payment;
    if (!payment) throw new Error("Payment record not found");

    //   FIX: Handle both field bookings and event-only orders
    const vendorId = order.items[0]?.field?.venue?.vendorId;
    const hasFieldBookings = order.items && order.items.length > 0;
    const hasEventTickets = order.eventTickets && order.eventTickets.length > 0;

    // Vendor is required only for field bookings
    if (hasFieldBookings && !vendorId) {
      throw new Error("Vendor not found for this order");
    }

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

      //   KUNCI UTAMA: Tambahkan saldo ke vendor (hanya untuk field bookings)
      if (hasFieldBookings && vendorId) {
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            balance: { increment: order.totalAmount },
          },
        });
      }

      // Handle Event Tickets (jika ada)
      if (hasEventTickets) {
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
    if (hasEventTickets) {
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
