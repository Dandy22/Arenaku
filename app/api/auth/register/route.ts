// ============================================================
// app/api/auth/register/route.ts
// ------------------------------------------------------------
//
// Endpoint ini HANYA bertugas:
//   1. Menerima request HTTP (POST)
//   2. Meneruskan data ke service layer
//   3. Mengembalikan response HTTP yang sesuai
//
// Semua validasi (email duplikat, password hash, dll) ada di authService.
// ============================================================

import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";

// POST /api/auth/register
// Body: { name, email, phone, password, role? }
// Response: data user yang baru dibuat (tanpa password)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Serahkan semua logika validasi dan pembuatan user ke service
    const newUser = await authService.register({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
      role: body.role, // opsional, default CUSTOMER
    });

    // Status 201 Created untuk resource yang baru dibuat
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    // 409 Conflict jika email sudah terdaftar, 400 untuk error lainnya
    const status = error.message.includes("already registered") ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}