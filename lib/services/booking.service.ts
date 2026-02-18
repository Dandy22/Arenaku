// ============================================================
// lib/services/booking.service.ts
// ------------------------------------------------------------
//
// Semua aturan bisnis yang berkaitan dengan pemesanan lapangan:
//   - Hanya CUSTOMER yang bisa booking
//   - Tidak boleh booking di slot waktu yang sudah terisi
//   - Validasi rentang jam yang masuk akal
//   - Validasi tanggal tidak boleh di masa lalu
//
// Service memanggil repository untuk semua operasi database.
// Route handler hanya memanggil service — tidak ada logika di route.
// ============================================================

import { bookingRepository } from "@/lib/repositories/booking.repository";

export const bookingService = {
  // ----------------------------------------------------------
  // createBooking
  // Memproses permintaan booking lapangan dari customer.
  //
  // Parameter:
  //   - userId   : ID user yang melakukan booking
  //   - userRole : Role user (harus CUSTOMER)
  //   - data     : Detail booking (lapangan, tanggal, jam)
  // ----------------------------------------------------------
  async createBooking(
    userId: string,
    userRole: string,
    data: {
      fieldId: string;
      date: string;   // format string "YYYY-MM-DD" dari request
      startHour: number; // jam mulai (0-23)
      endHour: number;   // jam selesai (1-24)
    }
  ) {
    // Rule 1: Hanya CUSTOMER yang boleh booking lapangan
    // VENDOR dan ADMIN tidak bisa booking (sesuai logika bisnis)
    if (userRole !== "CUSTOMER") {
      throw new Error("Only customers can book a field");
    }

    // Rule 2: Jam mulai harus lebih kecil dari jam selesai
    if (data.startHour >= data.endHour) {
      throw new Error("Start hour must be earlier than end hour");
    }

    // Rule 3: Jam harus dalam rentang yang valid (0-24)
    if (data.startHour < 0 || data.endHour > 24) {
      throw new Error("Hour must be between 0 and 24");
    }

    // Rule 4: Minimal durasi booking adalah 1 jam
    if (data.endHour - data.startHour < 1) {
      throw new Error("Minimum booking duration is 1 hour");
    }

    // Konversi string tanggal ke objek Date untuk disimpan ke database
    const bookingDate = new Date(data.date);

    // Rule 5: Tanggal tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0); // reset ke awal hari ini
    if (bookingDate < today) {
      throw new Error("Cannot book a field in the past");
    }

    // Rule 6: Cek konflik jadwal — apakah slot waktu ini sudah dibooking orang lain?
    const conflictingBooking = await bookingRepository.findConflict(
      data.fieldId,
      bookingDate,
      data.startHour,
      data.endHour
    );

    if (conflictingBooking) {
      throw new Error(
        `Time slot ${data.startHour}:00 - ${data.endHour}:00 is already booked`
      );
    }

    // Semua validasi lolos → buat booking baru
    const booking = await bookingRepository.create({
      userId,
      fieldId: data.fieldId,
      date: bookingDate,
      startHour: data.startHour,
      endHour: data.endHour,
    });

    return booking;
  },

  // ----------------------------------------------------------
  // getUserBookings
  // Mengambil riwayat semua booking milik user tertentu.
  // Siapapun yang sudah login bisa lihat booking mereka sendiri.
  // ----------------------------------------------------------
  async getUserBookings(userId: string) {
    return bookingRepository.findByUserId(userId);
  },

  // ----------------------------------------------------------
  // getAllBookings
  // Mengambil semua booking dari semua user.
  // Hanya dipakai untuk keperluan admin dashboard.
  // ----------------------------------------------------------
  async getAllBookings(userRole: string) {
    // Hanya ADMIN yang boleh lihat semua booking
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can view all bookings");
    }
    return bookingRepository.findAll();
  },
};