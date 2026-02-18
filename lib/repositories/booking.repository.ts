// ============================================================
// lib/repositories/booking.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Booking Repository
//
// Semua operasi database yang berkaitan dengan tabel "Booking".
// Layer ini tidak tahu apakah user boleh booking atau tidak —
// itu urusan service layer. Di sini hanya query database murni.
// ============================================================

import { prisma } from "@/lib/prisma";

export const bookingRepository = {
  // ----------------------------------------------------------
  // findConflict
  // Mengecek apakah sudah ada booking yang bentrok di slot waktu yang sama.
  //
  // Logika overlap waktu:
  //   Booking lama konflik dengan booking baru jika:
  //   → startHour lama < endHour baru  DAN  endHour lama > startHour baru
  //
  // Contoh: booking lama jam 10-12, booking baru jam 11-13 → KONFLIK
  //         booking lama jam 10-12, booking baru jam 12-14 → TIDAK konflik
  // ----------------------------------------------------------
  findConflict: (
    fieldId: string,
    date: Date,
    startHour: number,
    endHour: number
  ) =>
    prisma.booking.findFirst({
      where: {
        fieldId, // lapangan yang sama
        date,    // tanggal yang sama
        AND: [
          { startHour: { lt: endHour } },  // mulai sebelum booking baru selesai
          { endHour: { gt: startHour } },  // selesai setelah booking baru mulai
        ],
      },
    }),

  // ----------------------------------------------------------
  // create
  // Membuat booking baru dengan status awal "PENDING".
  // Status bisa berubah menjadi CONFIRMED / CANCELLED setelah proses berikutnya.
  // ----------------------------------------------------------
  create: (data: {
    userId: string;
    fieldId: string;
    date: Date;
    startHour: number;
    endHour: number;
  }) =>
    prisma.booking.create({
      data: {
        userId: data.userId,
        fieldId: data.fieldId,
        date: data.date,
        startHour: data.startHour,
        endHour: data.endHour,
        status: "PENDING", // status default saat booking baru dibuat
      },
    }),

  // ----------------------------------------------------------
  // findByUserId
  // Mengambil semua booking milik satu user tertentu.
  // Menyertakan data field dan venue agar tidak perlu query tambahan di frontend.
  // Diurutkan dari yang terbaru.
  // ----------------------------------------------------------
  findByUserId: (userId: string) =>
    prisma.booking.findMany({
      where: { userId },
      include: {
        field: {
          include: {
            venue: true, // sertakan data venue dari lapangan
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

  // ----------------------------------------------------------
  // findAll (untuk admin)
  // Mengambil semua booking dari semua user.
  // Menyertakan data user dan field untuk keperluan admin dashboard.
  // ----------------------------------------------------------
  findAll: () =>
    prisma.booking.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }, // jangan sertakan password
        },
        field: {
          include: { venue: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
};