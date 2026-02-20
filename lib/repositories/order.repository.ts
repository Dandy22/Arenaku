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
  // ----------------------------------------------------------
  // create
  // Buat order baru sekaligus dengan semua OrderItem-nya.
  // Menggunakan nested create Prisma (satu query, atomic).
  // ----------------------------------------------------------
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
      price: number; // snapshot harga saat order — tidak berubah walau vendor ubah harga
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
        // Buat semua OrderItem sekaligus dalam satu query
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

  // ----------------------------------------------------------
  // findById
  // Ambil detail order lengkap beserta item dan payment-nya.
  // Dipakai untuk halaman "Periksa Pesanan" dan "Payment".
  // ----------------------------------------------------------
  findById: (id: string) =>
    prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            field: { include: { venue: true } },
          },
        },
        payment: true, // sertakan data payment jika sudah ada
      },
    }),

  // ----------------------------------------------------------
  // findByUserId
  // Ambil semua order milik user tertentu.
  // Dipakai untuk riwayat pemesanan (kalau nanti dibutuhkan).
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // updateStatus
  // Update status order (PENDING → PAID / CANCELLED).
  // Dipanggil oleh payment service saat status payment berubah.
  // ----------------------------------------------------------
  updateStatus: (id: string, status: "PENDING" | "PAID" | "CANCELLED") =>
    prisma.order.update({
      where: { id },
      data: { status },
    }),
};