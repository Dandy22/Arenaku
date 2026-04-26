// ============================================================
// lib/services/cart.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic Layer: Cart Service
//
// Aturan bisnis untuk keranjang belanja:
//   - Hanya CUSTOMER yang bisa punya cart
//   - Tidak boleh tambah item yang jam-nya bentrok di lapangan sama
//   - Tidak boleh tambah item dengan tanggal di masa lalu
//   - User hanya bisa hapus item miliknya sendiri
// ============================================================

import { cartRepository } from "@/lib/repositories/cart.repository";

export const cartService = {
  async getCart(userId: string) {
    return cartRepository.findByUserId(userId);
  },

  async addToCart(
    userId: string,
    userRole: string,
    data: {
      fieldId: string;
      date: string;
      startHour: number;
      endHour: number;
    }
  ) {
    if (userRole !== "CUSTOMER") {
      throw new Error("Only customers can add items to cart");
    }

    if (data.startHour >= data.endHour) {
      throw new Error("Start hour must be earlier than end hour");
    }
    if (data.startHour < 0 || data.endHour > 24) {
      throw new Error("Hour must be between 0 and 24");
    }

    const bookingDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      throw new Error("Cannot add past dates to cart");
    }

    const cartConflict = await cartRepository.findConflict(
      userId, data.fieldId, bookingDate, data.startHour, data.endHour
    );
    if (cartConflict) {
      throw new Error("This time slot is already in your cart");
    }

    const bookingConflict = await cartRepository.findBookingConflict(
      data.fieldId, bookingDate, data.startHour, data.endHour
    );
    if (bookingConflict) {
      throw new Error(`Time slot ${data.startHour}:00 - ${data.endHour}:00 is already booked`);
    }

    return cartRepository.create({
      userId,
      fieldId: data.fieldId,
      date: bookingDate,
      startHour: data.startHour,
      endHour: data.endHour,
    });
  },

  async removeFromCart(userId: string, cartItemId: string) {
    const item = await cartRepository.findById(cartItemId);
    if (!item) throw new Error("Cart item not found");
    if (item.userId !== userId) {
      throw new Error("You are not authorized to remove this item");
    }
    return cartRepository.deleteById(cartItemId);
  },
};