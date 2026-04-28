// ============================================================
// lib/repositories/cart.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Cart Repository


import { prisma } from "@/lib/prisma";

export const cartRepository = {
  findByUserId: (userId: string) =>
    prisma.cartItem.findMany({
      where: { userId },
      include: {
        field: {
          include: { venue: true },
        },
        event: true,
      },
      orderBy: { createdAt: "asc" },
    }),

  findById: (id: string) =>
    prisma.cartItem.findUnique({
      where: { id },
      include: { field: true, event: true },
    }),

  // Conflict check for field bookings
  findConflict: (userId: string, fieldId: string, date: Date, startHour: number, endHour: number) =>
    prisma.cartItem.findFirst({
      where: {
        userId,
        fieldId,
        date,
        AND: [
          { startHour: { lt: endHour } },
          { endHour: { gt: startHour } },
        ],
      },
    }),

  // Conflict check for event tickets (user already has ticket for this event)
  findEventConflict: (userId: string, eventId: string) =>
    prisma.cartItem.findFirst({
      where: {
        userId,
        eventId,
      },
    }),

  // Cek konflik dengan order PAID orang lain
  findBookingConflict: (fieldId: string, date: Date, startHour: number, endHour: number) =>
    prisma.orderItem.findFirst({
      where: {
        fieldId,
        date,
        order: { status: "PAID" },
        AND: [
          { startHour: { lt: endHour } },
          { endHour: { gt: startHour } },
        ],
      },
    }),

  // Create field booking
  create: (data: {
    userId: string;
    fieldId: string;
    date: Date;
    startHour: number;
    endHour: number;
  }) =>
    prisma.cartItem.create({ data }),

  // Create event ticket
  createEventTicket: (data: {
    userId: string;
    eventId: string;
    date: Date;
    startHour: number;
    endHour: number;
    quantity: number;
  }) =>
    prisma.cartItem.create({ data }),

  deleteById: (id: string) =>
    prisma.cartItem.delete({ where: { id } }),

  deleteByUserId: (userId: string) =>
    prisma.cartItem.deleteMany({ where: { userId } }),
};