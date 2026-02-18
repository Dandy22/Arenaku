// ============================================================
// app/api/profile/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Profile Endpoint
//
//   - GET : Mengambil data profil user yang sedang login
//
// Menggunakan userRepository langsung karena ini operasi sederhana
// yang tidak butuh logika bisnis kompleks (tidak perlu service layer).
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/user.repository";

// GET /api/profile
// Header: Authorization: Bearer <token>
// Response: data profil user (tanpa password)
export async function GET(req: Request) {
  try {
    // Autentikasi: ambil data user dari JWT token
    const user = await getUserFromToken(req);

    // Ambil data lengkap user dari database
    // findById sudah dikonfigurasi untuk tidak menyertakan password
    const profile = await userRepository.findById(user.userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}