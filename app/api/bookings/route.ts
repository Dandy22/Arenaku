// ============================================================
// app/api/bookings/route.ts
// ------------------------------------------------------------
//
// Endpoint ini menangani dua method:
//   - POST : Membuat booking baru (hanya CUSTOMER)
//   - GET  : Melihat riwayat booking milik user yang login
//
// Semua logika bisnis ada di bookingService.
// Autentikasi dicek di awal via getUserFromToken.
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { bookingService } from "@/lib/services/booking.service";

// POST /api/bookings
// Header: Authorization: Bearer <token>
// Body: { fieldId, date, startHour, endHour }
// Response: data booking yang baru dibuat
export async function POST(req: Request) {
  try {
    // Autentikasi: ambil data user dari JWT token
    // Akan throw error jika token tidak ada atau tidak valid
    const user = await getUserFromToken(req);
    const body = await req.json();

    // Serahkan seluruh logika pembuatan booking ke service
    const booking = await bookingService.createBooking(
      user.userId,
      user.role,
      {
        fieldId: body.fieldId,
        date: body.date,
        startHour: body.startHour,
        endHour: body.endHour,
      }
    );

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    // Tentukan status code berdasarkan jenis error
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("Only customers")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/bookings
// Header: Authorization: Bearer <token>
// Response: array semua booking milik user yang sedang login
export async function GET(req: Request) {
  try {
    // Autentikasi: harus login untuk lihat riwayat booking
    const user = await getUserFromToken(req);

    const bookings = await bookingService.getUserBookings(user.userId);
    return NextResponse.json(bookings, { status: 200 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}