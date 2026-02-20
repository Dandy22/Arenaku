// ============================================================
// lib/repositories/booking.repository.ts
// ------------------------------------------------------------
// UPDATE: Model Booking sudah dihapus dari schema.
// Cek konflik jadwal sekarang lewat tabel OrderItem,
// karena OrderItem adalah pengganti Booking yang sudah PAID.
// ============================================================

import { prisma } from "@/lib/prisma";

export const bookingRepository = {
  // Logika overlap: startLama < endBaru DAN endLama > startBaru
  findConflict: (
    fieldId: string,
    date: Date,
    startHour: number,
    endHour: number
  ) =>
    prisma.orderItem.findFirst({
      where: {
        fieldId,
        date,
        order: {
          status: "PAID",
        },
        AND: [
          { startHour: { lt: endHour } },
          { endHour: { gt: startHour } },
        ],
      },
    }),
};