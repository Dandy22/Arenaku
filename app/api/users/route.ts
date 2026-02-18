// ============================================================
// app/api/users/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Users Endpoint (Admin Only)
//
//   - GET : Mengambil semua user (HANYA ADMIN)
//
// PERBAIKAN dari kode original:
// Di kode original, endpoint ini TIDAK ada autentikasi sama sekali.
// Artinya siapapun bisa akses daftar semua user tanpa login — ini
// adalah celah keamanan serius (data breach).
// Sekarang endpoint ini hanya bisa diakses oleh ADMIN.
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/user.repository";

// GET /api/users
// Header: Authorization: Bearer <token> (harus ADMIN)
// Response: array semua user (tanpa password)
export async function GET(req: Request) {
  try {
    // Autentikasi: harus login
    const user = await getUserFromToken(req);

    // Otorisasi: hanya ADMIN yang boleh melihat semua data user
    // CUSTOMER dan VENDOR tidak boleh akses data user lain
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin only" },
        { status: 403 }
      );
    }

    // Ambil semua user — password tidak disertakan (dikonfigurasi di repository)
    const users = await userRepository.findAll();
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}