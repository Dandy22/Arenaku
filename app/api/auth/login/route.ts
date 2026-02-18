// ============================================================
// app/api/auth/login/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Login Endpoint
//
// Endpoint ini HANYA bertugas:
//   1. Menerima request HTTP (POST)
//   2. Meneruskan data ke service layer
//   3. Mengembalikan response HTTP yang sesuai
//
// ============================================================

import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";

// POST /api/auth/login
// Body: { email: string, password: string }
// Response: { token: string, user: { id, name, email, role } }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Serahkan semua logika ke service layer
    const result = await authService.login(email, password);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    // Tentukan HTTP status code berdasarkan jenis error
    const status =
      error.message === "User not found" ||
      error.message === "Invalid email or password"
        ? 401
        : 400;

    return NextResponse.json({ error: error.message }, { status });
  }
}