// ============================================================
// lib/prisma.ts
// ------------------------------------------------------------
// TIER 3 SUPPORT — Inisialisasi koneksi database via Prisma ORM
//
// Menggunakan pola "singleton" agar tidak membuat koneksi baru
// setiap kali ada request (terutama penting di Next.js development
// yang menggunakan hot reload — tanpa ini koneksi bisa menumpuk).
//
// Menggunakan adapter @prisma/adapter-pg untuk koneksi ke PostgreSQL
// melalui connection pool (pg.Pool) — lebih efisien dari koneksi biasa.
// ============================================================

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Buat connection pool ke PostgreSQL menggunakan DATABASE_URL dari .env
// Connection pool lebih efisien karena koneksi dipakai ulang, tidak dibuat baru setiap query
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Adapter yang menghubungkan Prisma dengan driver pg (PostgreSQL native)
const adapter = new PrismaPg(pool);

// Trik untuk menyimpan instance Prisma di global object
// Ini mencegah pembuatan koneksi baru saat hot-reload di development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// Gunakan instance yang sudah ada di global jika tersedia,
// atau buat instance baru jika belum ada
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    // Uncomment baris di bawah untuk melihat query yang dijalankan (debugging)
    // log: ["query", "error", "warn"],
  });

// Simpan instance ke global hanya di mode development
// Di production, setiap request sudah di-handle secara terpisah
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}