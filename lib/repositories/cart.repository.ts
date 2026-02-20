// ============================================================
// lib/repositories/cart.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Cart Repository


import { prisma } from "@/lib/prisma";

export const cartRepository = {
  // ----------------------------------------------------------
  // findByUserId
  // Ambil semua item cart milik user tertentu.
  // Sertakan data field + venue agar frontend bisa tampilkan detail.
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // findById
  // Ambil satu cart item berdasarkan ID.
  // Dipakai untuk verifikasi kepemilikan sebelum hapus.
  // ----------------------------------------------------------
  findById: (id: string) =>
    prisma.cartItem.findUnique({
      where: { id },
      include: { field: true },
    }),

  // ----------------------------------------------------------
  // findConflict
  // Cek apakah lapangan di jam yang sama sudah ada di cart user ini.
  // Mencegah user menambah item yang sama dua kali ke cart.
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // create
  // Tambah item baru ke cart.
  // ----------------------------------------------------------
  create: (data: {
    userId: string;
    fieldId: string;
    date: Date;
    startHour: number;
    endHour: number;
  }) =>
    prisma.cartItem.create({ data }),

  // ----------------------------------------------------------
  // deleteById
  // Hapus satu item dari cart (user klik tombol hapus di cart).
  // ----------------------------------------------------------
  deleteById: (id: string) =>
    prisma.cartItem.delete({ where: { id } }),

  // ----------------------------------------------------------
  // deleteByUserId
  // Hapus SEMUA item cart milik user.
  // Dipanggil setelah checkout berhasil — cart dikosongkan.
  // ----------------------------------------------------------
  deleteByUserId: (userId: string) =>
    prisma.cartItem.deleteMany({ where: { userId } }),
};