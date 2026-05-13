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
    },
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
      userId,
      data.fieldId,
      bookingDate,
      data.startHour,
      data.endHour,
    );
    if (cartConflict) {
      throw new Error("This time slot is already in your cart");
    }

    const bookingConflict = await cartRepository.findBookingConflict(
      data.fieldId,
      bookingDate,
      data.startHour,
      data.endHour,
    );
    if (bookingConflict) {
      throw new Error(
        `Time slot ${data.startHour}:00 - ${data.endHour}:00 is already booked`,
      );
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

  // Add event ticket to cart
  async addEventToCart(
    userId: string,
    userRole: string,
    data: {
      eventId: string;
      ticketTierId?: string;
      quantity: number;
    },
  ) {
    if (userRole !== "CUSTOMER") {
      throw new Error("Only customers can buy event tickets");
    }

    const { prisma } = await import("@/lib/prisma");

    // Get event details to validate
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (!event.allowMultiplePurchases) {
      const cartConflict = await cartRepository.findEventConflict(
        userId,
        data.eventId,
      );
      if (cartConflict) {
        throw new Error(
          "You already have a ticket for this event in your cart",
        );
      }
    }

    if (event.status === "CANCELLED") {
      throw new Error("Cannot buy ticket for cancelled event");
    }

    if (event.status === "COMPLETED") {
      throw new Error("Event has already ended");
    }

    // Check capacity
    const participantCount = await prisma.eventParticipant.count({
      where: { eventId: data.eventId },
    });

    if (participantCount >= event.capacity) {
      throw new Error("Event is full");
    }

    // Check if user already has a confirmed ticket (only if multiple purchases not allowed)
    if (!event.allowMultiplePurchases) {
      const existingTicket = await prisma.eventTicket.findFirst({
        where: {
          eventId: data.eventId,
          userId,
          status: "CONFIRMED",
        },
      });

      if (existingTicket) {
        throw new Error("You already have a confirmed ticket for this event");
      }
    }

    let ticketPrice = event.ticketPrice || 0;
    let ticketTierId = undefined as string | undefined;

    if (data.ticketTierId) {
      const tier = await prisma.eventTicketTier.findUnique({
        where: { id: data.ticketTierId },
      });
      if (!tier || tier.eventId !== data.eventId) {
        throw new Error("Selected ticket tier is invalid");
      }
      if (tier.stock < data.quantity) {
        throw new Error("Not enough ticket stock for the selected tier");
      }
      ticketPrice = tier.price;
      ticketTierId = tier.id;
    }

    // Add to cart - use event date as the booking date
    return cartRepository.createEventTicket({
      userId,
      eventId: data.eventId,
      ticketTierId,
      ticketPrice,
      date: event.date, // Use event date
      startHour: event.startHour,
      endHour: event.endHour,
      quantity: data.quantity,
    });
  },
};
