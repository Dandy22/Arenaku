// ============================================================
// lib/repositories/order.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Order Repository
//
// Order adalah transaksi final setelah user konfirmasi dari cart.
// Satu order bisa berisi banyak lapangan (OrderItem).
// ============================================================

import { prisma } from "@/lib/prisma";

export const orderRepository = {
  findConflict: (fieldId: string, date: Date, startHour: number, endHour: number) =>
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
    totalAmount: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    notes: string;
    items: {
      fieldId: string;
      date: Date;
      startHour: number;
      endHour: number;
      price: number;
    }[];
  }) =>
    prisma.order.create({
      data: {
        userId: data.userId,
        totalAmount: data.totalAmount,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            fieldId: item.fieldId,
            date: item.date,
            startHour: item.startHour,
            endHour: item.endHour,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            field: { include: { venue: true } },
          },
        },
      },
    }),

  findById: (id: string) =>
    prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            field: { include: { venue: true } },
          },
        },
        payment: true,
      },
    }),

  findByUserId: (userId: string) =>
    prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            field: { include: { venue: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),

  updateStatus: (id: string, status: "PENDING" | "PAID" | "CANCELLED") =>
    prisma.order.update({
      where: { id },
      data: { status },
    }),
};