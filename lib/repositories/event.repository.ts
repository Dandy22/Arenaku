// ============================================================
// lib/repositories/event.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Event Repository
//
// Operasi database untuk tabel "Event" dan "EventParticipant".
// Event adalah turnamen/acara olahraga yang bisa diikuti user.
// ============================================================

import { prisma } from "@/lib/prisma";

export const eventRepository = {
  // ----------------------------------------------------------
  // create
  // Membuat event baru. creatorId adalah userId yang membuat event.
  // ----------------------------------------------------------
  create: (data: {
    title: string;
    description: string;
    location: string;
    date: Date;
    startHour: number;
    endHour: number;
    ticketPrice: number;
    capacity: number;   // kapasitas maksimal peserta
    creatorId: string;  // userId pembuat event
  }) =>
    prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        date: data.date,
        startHour: data.startHour,
        endHour: data.endHour,
        ticketPrice: data.ticketPrice,
        capacity: data.capacity,
        creatorId: data.creatorId,
      },
    }),

  // ----------------------------------------------------------
  // findById
  // Mencari satu event beserta daftar peserta yang sudah join.
  // Jumlah peserta dipakai untuk cek kapasitas di service layer.
  // ----------------------------------------------------------
  findById: (id: string) =>
    prisma.event.findUnique({
      where: { id },
      include: {
        participants: true, // perlu untuk ngecek kapasitas dan duplikat
        creator: {
          select: { id: true, name: true, email: true }, // info pembuat event
        },
      },
    }),

  // ----------------------------------------------------------
  // findAll
  // Mengambil semua event yang tersedia (untuk halaman publik).
  // Menyertakan jumlah peserta agar frontend bisa tampilkan sisa slot.
  // ----------------------------------------------------------
  findAll: () =>
    prisma.event.findMany({
      include: {
        participants: true,
        creator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "asc" }, // urutkan dari yang paling dekat tanggalnya
    }),

  // ----------------------------------------------------------
  // findParticipant
  // Mengecek apakah user sudah pernah join event ini sebelumnya.
  // Dipakai untuk mencegah user mendaftar dua kali ke event yang sama.
  // ----------------------------------------------------------
  findParticipant: (eventId: string, userId: string) =>
    prisma.eventParticipant.findFirst({
      where: { eventId, userId },
    }),

  // ----------------------------------------------------------
  // addParticipant
  // Mendaftarkan user ke sebuah event.
  // Dipanggil hanya setelah semua validasi lolos di service layer.
  // ----------------------------------------------------------
  addParticipant: (eventId: string, userId: string) =>
    prisma.eventParticipant.create({
      data: { eventId, userId },
    }),
};