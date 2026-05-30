// ============================================================
// lib/services/order.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic Layer: Order Service
//
// Order dibuat saat user klik "Konfirmasi Pesanan" di halaman checkout.
// Proses:
//   1. Ambil semua item dari cart user
//   2. Validasi ulang semua slot (cek konflik lagi, bisa saja
//      slot sudah dibooking orang lain sejak item masuk cart)
//   3. Hitung total harga
//   4. Buat Order + OrderItem
//   5. Kosongkan cart user
// ============================================================
import { orderRepository } from "@/lib/repositories/order.repository";
import { cartRepository } from "@/lib/repositories/cart.repository";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification.service";

export const orderService = {
  async createOrder(
    userId: string,
    userRole: string,
    data: {
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      notes?: string;
    },
  ) {
    if (userRole !== "CUSTOMER") {
      throw new Error("Only customers can create orders");
    }

    if (!data.customerName || !data.customerPhone || !data.customerEmail) {
      throw new Error("Customer name, phone, and email are required");
    }

    const cartItems = await cartRepository.findByUserId(userId);
    if (cartItems.length === 0) {
      throw new Error("Cart is empty. Add items before checkout");
    }

    // Separate field bookings and event tickets
    const fieldItems = cartItems.filter((item) => item.fieldId);
    const eventItems = cartItems.filter((item) => item.eventId);

    // Validate field bookings
    for (const item of fieldItems) {
      if (!item.fieldId) continue;
      const conflict = await orderRepository.findConflict(
        item.fieldId,
        item.date,
        item.startHour,
        item.endHour,
      );
      if (conflict) {
        throw new Error(
          `${item.field?.name || "Field"} pada jam ${item.startHour}:00 - ${item.endHour}:00 sudah dibooking orang lain. Hapus dari cart dan pilih jam lain.`,
        );
      }
    }

    // Validate event tickets - check capacity
    for (const item of eventItems) {
      if (!item.eventId || !item.event) continue;

      const participantCount = await prisma.eventParticipant.count({
        where: { eventId: item.eventId },
      });

      if (participantCount >= item.event.capacity) {
        throw new Error(`Event ${item.event.title} is full`);
      }

      // Check if event is still active
      if (item.event.status === "CANCELLED") {
        throw new Error(`Event ${item.event.title} has been cancelled`);
      }
    }

    // Calculate total amount
    let totalAmount = 0;

    // Field booking total
    for (const item of fieldItems) {
      const duration = item.endHour - item.startHour;
      totalAmount += (item.field?.price || 0) * duration;
    }

    // Event ticket total
    for (const item of eventItems) {
      const ticketPrice = item.ticketPrice ?? item.event?.ticketPrice ?? 0;
      totalAmount += ticketPrice * item.quantity;
    }

    let order;

    // Create order based on cart contents
    if (fieldItems.length > 0 && eventItems.length > 0) {
      // Mixed order (both field bookings and event tickets)
      order = await orderRepository.createWithMixedItems({
        userId,
        totalAmount,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes: data.notes || "",
        items: fieldItems.map((item) => ({
          fieldId: item.fieldId!,
          date: item.date,
          startHour: item.startHour,
          endHour: item.endHour,
          price: item.field?.price || 0,
        })),
        eventTickets: eventItems.map((item) => ({
          eventId: item.eventId!,
          quantity: item.quantity,
          price: (item.ticketPrice ?? item.event?.ticketPrice) || 0,
        })),
      });
    } else if (eventItems.length > 0) {
      // Event tickets only
      order = await orderRepository.createWithEventTickets({
        userId,
        totalAmount,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes: data.notes || "",
        eventTickets: eventItems.map((item) => ({
          eventId: item.eventId!,
          quantity: item.quantity,
          price: (item.ticketPrice ?? item.event?.ticketPrice) || 0,
        })),
      });
    } else {
      // Field bookings only (original behavior)
      order = await orderRepository.create({
        userId,
        totalAmount,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes: data.notes || "",
        items: fieldItems.map((item) => ({
          fieldId: item.fieldId!,
          date: item.date,
          startHour: item.startHour,
          endHour: item.endHour,
          price: item.field?.price || 0,
        })),
      });
    }

    await cartRepository.deleteByUserId(userId);

    // Trigger notifikasi Booking Baru
    if (order) {
      await notificationService.notifyBookingNew(order.id);
    }

    return order;
  },

  async getOrderById(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) {
      throw new Error("You are not authorized to view this order");
    }

    // Cek apakah order ini sudah di-review
    const { ratingRepository } =
      await import("@/lib/repositories/rating.repository");
    const vendorRating = await ratingRepository.checkExistingRating(orderId);

    // Kirim order beserta info vendorRating ke frontend
    return { ...order, vendorRating };
  },

  async requestRefund(userId: string, orderId: string, cancelReason?: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) {
      throw new Error(
        "You are not authorized to request refund for this order",
      );
    }
    if (order.status !== "PAID") {
      throw new Error("Only paid orders can be refunded");
    }

    // Check if user has already rated this order
    const { ratingRepository } =
      await import("@/lib/repositories/rating.repository");
    const existingRating = await ratingRepository.checkExistingRating(orderId);
    if (existingRating) {
      throw new Error(
        "Cannot request refund for orders that have already been rated",
      );
    }

    // Check if 24 hours have passed since order creation
    const orderCreatedAt = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceOrder =
      (now.getTime() - orderCreatedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceOrder > 24) {
      throw new Error(
        "Refund requests are only allowed within 24 hours of order creation",
      );
    }

    // Simpan status REFUND_REQUESTED beserta alasannya
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REFUND_REQUESTED",
        cancelReason: cancelReason || "Tidak ada alasan pembatalan",
      },
    });

    // Notify admin
    await notificationService.notifyRefundRequest(orderId);

    return updatedOrder;
  },

  // 🔥 FUNGSI BARU UNTUK ADMIN MEMPROSES REFUND
  async processRefundDecision(
    orderId: string,
    status: "ACCEPT" | "REJECT",
    adminNote: string,
  ) {
    // 1. Cek order
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "REFUND_REQUESTED") {
      throw new Error(
        "Hanya pesanan berstatus REFUND_REQUESTED yang bisa diproses",
      );
    }

    // 2. Tentukan status baru (Jika diterima jadi REFUNDED, jika ditolak kembali jadi PAID)
    const newStatus = status === "ACCEPT" ? "REFUNDED" : "PAID";

    // 3. Update status pesanan di database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
      },
    });

    // 4. Kirim notifikasi hasil refund ke pelanggan
    await notificationService.notifyRefundResult(orderId, status, adminNote);

    return updatedOrder;
  },

  async refundComplete(adminId: string, orderId: string) {
    // Only admin can call this
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "REFUND_REQUESTED") {
      throw new Error("Order is not in refund requested status");
    }

    // Update status to REFUNDED
    const updatedOrder = await orderRepository.updateStatus(
      orderId,
      "REFUNDED",
    );

    return updatedOrder;
  },

  async getUserOrders(userId: string) {
    return orderRepository.findByUserId(userId);
  },
};
