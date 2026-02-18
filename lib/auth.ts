// ============================================================
// lib/auth.ts
// ------------------------------------------------------------
// TIER 2 SUPPORT — Helper autentikasi JWT
//
// File ini berisi dua fungsi utama:
//   1. verifyToken  → memvalidasi token JWT yang diterima
//   2. getUserFromToken → mengekstrak data user dari request header
//
// Dipakai oleh semua route yang butuh autentikasi (protected routes).
// JWT Secret diambil dari environment variable agar tidak hardcoded
// di source code (best practice keamanan).
// ============================================================

import jwt from "jsonwebtoken";

// Ambil secret dari .env — JANGAN hardcode langsung di sini
// Contoh isi .env: JWT_SECRET=kunci_rahasia_panjang_dan_random
const SECRET = process.env.JWT_SECRET || "SECRET_KEY_DEV_ONLY";

// ------------------------------------------------------------
// verifyToken
// ------------------------------------------------------------
// Fungsi untuk memverifikasi token JWT yang dikirim oleh client.
// Jika token valid → kembalikan payload { userId, role }
// Jika token invalid / expired → kembalikan null
// ------------------------------------------------------------
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as {
      userId: string;
      role: string;
    };
  } catch (error) {
    // Token tidak valid atau sudah expired
    return null;
  }
}

// ------------------------------------------------------------
// getUserFromToken
// ------------------------------------------------------------
// Fungsi async untuk mengambil data user dari Authorization header.
// Format header yang diharapkan: "Bearer <token>"
//
// Dipakai di route handler untuk protected endpoints.
// Jika token tidak ada atau invalid → throw Error (ditangkap di route).
// ------------------------------------------------------------
export async function getUserFromToken(req: Request) {
  // Ambil header Authorization dari request
  const authHeader = req.headers.get("authorization");

  // Jika header tidak ada → tolak request
  if (!authHeader) {
    throw new Error("No token provided");
  }

  // Pisahkan "Bearer" dan token-nya → ambil bagian token saja
  const token = authHeader.split(" ")[1];

  // Verifikasi token
  const user = verifyToken(token);

  // Jika token tidak valid → tolak request
  if (!user) {
    throw new Error("Invalid or expired token");
  }

  return user;
}