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
  findConflict: (
    fieldId: string,
    date: Date,
    startHour: number,
    endHour: number,
  ) =>
    prisma.orderItem.findFirst({
      where: {
        fieldId,
        date,
        order: { status: "PAID" },
        AND: [{ startHour: { lt: endHour } }, { endHour: { gt: startHour } }],
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
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
        user: true,
        items: {
          include: {
            field: { include: { venue: true } },
          },
        },
        eventTickets: {
          include: {
            event: true,
          },
        },
        payment: true,
      },
    }),

  getOrderById: (id: string) =>
    prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            field: { include: { venue: true } },
          },
        },
        eventTickets: {
          include: {
            event: true,
          },
        },
        payment: true,
      },
    }),

  // HANYA ADA SATU updateStatus DI SINI
  updateStatus: (
    id: string,
    status: "PENDING" | "PAID" | "CANCELLED" | "REFUND_REQUESTED" | "REFUNDED",
  ) =>
    prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        items: {
          include: {
            field: { include: { venue: true } },
          },
        },
        eventTickets: {
          include: {
            event: true,
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
        eventTickets: {
          include: {
            event: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),

  // Create order with event tickets (no field items)
  createWithEventTickets: (data: {
    userId: string;
    totalAmount: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    notes: string;
    eventTickets: {
      eventId: string;
      quantity: number;
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
        // Create event tickets linked to this order
        eventTickets: {
          create: data.eventTickets.map((ticket) => ({
            eventId: ticket.eventId,
            userId: data.userId,
            quantity: ticket.quantity,
            totalPrice: ticket.price * ticket.quantity,
            status: "PENDING",
          })),
        },
      },
      include: {
        eventTickets: {
          include: {
            event: true,
          },
        },
        payment: true,
      },
    }),

  // Create order with both field items and event tickets
  createWithMixedItems: (data: {
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
    eventTickets: {
      eventId: string;
      quantity: number;
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
        items: {
          create: data.items.map((item) => ({
            fieldId: item.fieldId,
            date: item.date,
            startHour: item.startHour,
            endHour: item.endHour,
            price: item.price,
          })),
        },
        eventTickets: {
          create: data.eventTickets.map((ticket) => ({
            eventId: ticket.eventId,
            userId: data.userId,
            quantity: ticket.quantity,
            totalPrice: ticket.price * ticket.quantity,
            status: "PENDING",
          })),
        },
      },
      include: {
        items: {
          include: {
            field: { include: { venue: true } },
          },
        },
        eventTickets: {
          include: {
            event: true,
          },
        },
        payment: true,
      },
    }),
};
