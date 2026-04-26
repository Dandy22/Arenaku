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
      },
      orderBy: { createdAt: "asc" },
    }),

  findById: (id: string) =>
    prisma.cartItem.findUnique({
      where: { id },
      include: { field: true },
    }),

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

  create: (data: {
    userId: string;
    fieldId: string;
    date: Date;
    startHour: number;
    endHour: number;
  }) =>
    prisma.cartItem.create({ data }),

  deleteById: (id: string) =>
    prisma.cartItem.delete({ where: { id } }),

  deleteByUserId: (userId: string) =>
    prisma.cartItem.deleteMany({ where: { userId } }),
};