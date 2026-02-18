// ============================================================
// lib/repositories/user.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: User Repository
//
// Repository bertugas HANYA untuk berkomunikasi dengan database.
// Tidak ada logika bisnis di sini — hanya operasi CRUD murni.
//
// Semua query Prisma yang berkaitan dengan tabel "User" ada di sini.
// Dengan memisahkan ini, jika suatu saat database diganti
// (misal dari PostgreSQL ke MySQL), cukup ubah file ini saja.
// ============================================================

import { prisma } from "@/lib/prisma";

export const userRepository = {
  // ----------------------------------------------------------
  // findByEmail
  // Mencari satu user berdasarkan email (untuk login & cek duplikat).
  // Mengembalikan null jika tidak ditemukan.
  // ----------------------------------------------------------
  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
    }),

  // ----------------------------------------------------------
  // findById
  // Mencari satu user berdasarkan ID (untuk profile, verifikasi, dll).
  // Password dikecualikan agar tidak ikut terkirim ke client.
  // ----------------------------------------------------------
  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        // password SENGAJA tidak diinclude — jangan pernah kirim password ke client!
        vendorProfile: true,
      },
    }),

  // ----------------------------------------------------------
  // findAll
  // Mengambil semua user (hanya untuk ADMIN).
  // Password tidak disertakan demi keamanan.
  // ----------------------------------------------------------
  findAll: () =>
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        // password dikecualikan
      },
      orderBy: { createdAt: "desc" },
    }),

  // ----------------------------------------------------------
  // create
  // Membuat user baru di database.
  // Jika role VENDOR → otomatis buat VendorProfile kosong sekaligus.
  // Password yang diterima di sini sudah di-hash (dilakukan di service layer).
  // ----------------------------------------------------------
  create: (data: {
    name: string;
    email: string;
    phone: string;
    password: string; // harus sudah di-hash sebelum masuk sini
    role?: "CUSTOMER" | "VENDOR" | "ADMIN";
  }) =>
    prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role ?? "CUSTOMER", // default CUSTOMER jika tidak diisi

        // Jika mendaftar sebagai VENDOR → buat profil vendor kosong secara otomatis
        vendorProfile:
          data.role === "VENDOR" ? { create: {} } : undefined,
      },
      include: {
        vendorProfile: true, // sertakan data vendorProfile di response
      },
    }),
};