// ============================================================
// lib/repositories/field.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Field (Lapangan) Repository
//
// Operasi database untuk tabel "Field".
// Field adalah lapangan olahraga di dalam sebuah Venue.
// ============================================================

import { prisma } from "@/lib/prisma";

export const fieldRepository = {
  // ----------------------------------------------------------
  // create
  // Membuat lapangan baru di dalam sebuah venue.
  // Validasi kepemilikan venue dilakukan di service layer sebelum masuk sini.
  // ----------------------------------------------------------
  create: (data: {
    name: string;
    type: string;    // contoh: "FUTSAL", "BADMINTON", "BASKETBALL"
    price: number;   // harga per jam dalam rupiah
    venueId: string; // venue tempat lapangan ini berada
  }) =>
    prisma.field.create({
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        venueId: data.venueId,
      },
    }),

  // ----------------------------------------------------------
  // findById
  // Mencari satu lapangan beserta data venue-nya.
  // Dipakai untuk verifikasi sebelum booking dan tampilan detail.
  // ----------------------------------------------------------
  findById: (id: string) =>
    prisma.field.findUnique({
      where: { id },
      include: {
        venue: true, // sertakan data venue induk
      },
    }),

  // ----------------------------------------------------------
  // findByVenueId
  // Mengambil semua lapangan dalam satu venue tertentu.
  // Dipakai untuk menampilkan daftar lapangan di halaman venue.
  // ----------------------------------------------------------
  findByVenueId: (venueId: string) =>
    prisma.field.findMany({
      where: { venueId },
      orderBy: { name: "asc" }, // urutkan berdasarkan nama lapangan
    }),
};