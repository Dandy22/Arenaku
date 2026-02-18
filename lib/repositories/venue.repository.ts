// ============================================================
// lib/repositories/venue.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Venue Repository
//
// Semua operasi database yang berkaitan dengan tabel "Venue"
// dan "VendorProfile". Tidak ada validasi bisnis di sini.
// ============================================================

import { prisma } from "@/lib/prisma";

export const venueRepository = {
  // ----------------------------------------------------------
  // findVendorProfileByUserId
  // Mencari VendorProfile berdasarkan userId.
  // Dibutuhkan untuk mendapatkan vendorId sebelum membuat venue.
  // VendorProfile dibuat otomatis saat user mendaftar sebagai VENDOR.
  // ----------------------------------------------------------
  findVendorProfileByUserId: (userId: string) =>
    prisma.vendorProfile.findUnique({
      where: { userId },
    }),

  // ----------------------------------------------------------
  // create
  // Membuat venue baru yang dikaitkan ke VendorProfile tertentu.
  // vendorId adalah ID dari VendorProfile (bukan userId langsung).
  // ----------------------------------------------------------
  create: (data: {
    name: string;
    description: string;
    city: string;
    vendorId: string; // ID VendorProfile, bukan ID User
  }) =>
    prisma.venue.create({
      data: {
        name: data.name,
        description: data.description,
        city: data.city,
        vendorId: data.vendorId,
      },
    }),

  // ----------------------------------------------------------
  // findById
  // Mencari satu venue beserta daftar lapangan (fields) di dalamnya.
  // Dipakai untuk verifikasi kepemilikan dan menampilkan detail venue.
  // ----------------------------------------------------------
  findById: (id: string) =>
    prisma.venue.findUnique({
      where: { id },
      include: {
        fields: true, // sertakan daftar lapangan
      },
    }),

  // ----------------------------------------------------------
  // findByVendorId
  // Mengambil semua venue milik satu vendor tertentu.
  // Dipakai untuk menampilkan daftar venue di dashboard vendor.
  // ----------------------------------------------------------
  findByVendorId: (vendorId: string) =>
    prisma.venue.findMany({
      where: { vendorId },
      include: {
        fields: true, // sertakan lapangan di tiap venue
      },
    }),

  // ----------------------------------------------------------
  // findAll
  // Mengambil semua venue (untuk halaman pencarian / publik).
  // ----------------------------------------------------------
  findAll: () =>
    prisma.venue.findMany({
      include: {
        fields: true,
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }, // info kontak vendor
            },
          },
        },
      },
    }),
};