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

export const orderService = {
  async createOrder(
    userId: string,
    userRole: string,
    data: {
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      notes?: string;
    }
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

    for (const item of cartItems) {
      const conflict = await orderRepository.findConflict(
        item.fieldId,
        item.date,
        item.startHour,
        item.endHour
      );
      if (conflict) {
        throw new Error(
          `${item.field.name} pada jam ${item.startHour}:00 - ${item.endHour}:00 sudah dibooking orang lain. Hapus dari cart dan pilih jam lain.`
        );
      }
    }

    const totalAmount = cartItems.reduce((acc, item) => {
      const duration = item.endHour - item.startHour;
      return acc + item.field.price * duration;
    }, 0);

    const order = await orderRepository.create({
      userId,
      totalAmount,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      notes: data.notes || "",
      items: cartItems.map((item) => ({
        fieldId: item.fieldId,
        date: item.date,
        startHour: item.startHour,
        endHour: item.endHour,
        price: item.field.price,
      })),
    });

    await cartRepository.deleteByUserId(userId);

    return order;
  },

  async getOrderById(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) {
      throw new Error("You are not authorized to view this order");
    }
    return order;
  },

  async getUserOrders(userId: string) {
    return orderRepository.findByUserId(userId);
  },
};