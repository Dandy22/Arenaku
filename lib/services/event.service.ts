// ============================================================
// lib/services/event.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic Layer: Event Service
//
// Logika bisnis untuk manajemen event/turnamen:
//   - Validasi data event (tanggal, kapasitas, harga)
//   - Cek kapasitas sebelum user join event
//   - Cegah user yang sama join dua kali ke event yang sama
// ============================================================

import { eventRepository } from "@/lib/repositories/event.repository";

export const eventService = {
  // ----------------------------------------------------------
  // createEvent
  // Membuat event baru (turnamen atau acara olahraga).
  // Siapapun yang sudah login bisa membuat event (tidak dibatasi role).
  //
  // Parameter:
  //   - creatorId : userId dari user yang membuat event
  //   - data      : Detail event
  // ----------------------------------------------------------
  async createEvent(
    creatorId: string,
    data: {
      title: string;
      description: string;
      location: string;
      date: string;        // format string dari request, dikonversi ke Date
      startHour: number;
      endHour: number;
      ticketPrice: number;
      capacity: number;    // batas maksimal peserta
    }
  ) {
    // Validasi field yang wajib diisi
    if (!data.title || !data.location || !data.date) {
      throw new Error("Title, location, and date are required");
    }

    // Validasi kapasitas harus lebih dari 0
    if (data.capacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }

    // Validasi harga tiket tidak boleh negatif
    if (data.ticketPrice < 0) {
      throw new Error("Ticket price cannot be negative");
    }

    // Validasi jam mulai harus sebelum jam selesai
    if (data.startHour >= data.endHour) {
      throw new Error("Start hour must be earlier than end hour");
    }

    // Konversi tanggal dari string ke Date
    const eventDate = new Date(data.date);

    // Validasi tanggal event tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      throw new Error("Event date cannot be in the past");
    }

    // Buat event baru via repository
    const event = await eventRepository.create({
      title: data.title,
      description: data.description,
      location: data.location,
      date: eventDate,
      startHour: data.startHour,
      endHour: data.endHour,
      ticketPrice: data.ticketPrice,
      capacity: data.capacity,
      creatorId,
    });

    return event;
  },

  // ----------------------------------------------------------
  // joinEvent
  // Mendaftarkan user ke sebuah event.
  //
  // Pemeriksaan yang dilakukan:
  //   1. Event harus ada
  //   2. Kapasitas belum penuh
  //   3. User belum pernah join event ini sebelumnya
  // ----------------------------------------------------------
  async joinEvent(userId: string, eventId: string) {
    // Check 1: Pastikan event ada
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check 2: Cek kapasitas — bandingkan jumlah peserta saat ini vs maksimal
    if (event.participants.length >= event.capacity) {
      throw new Error(
        `Event is full (${event.participants.length}/${event.capacity} participants)`
      );
    }

    // Check 3: Cek apakah user sudah pernah join event ini
    const alreadyJoined = await eventRepository.findParticipant(eventId, userId);
    if (alreadyJoined) {
      throw new Error("You have already joined this event");
    }

    // Semua validasi lolos → daftarkan user ke event
    const participant = await eventRepository.addParticipant(eventId, userId);
    return participant;
  },

  // ----------------------------------------------------------
  // getAllEvents
  // Mengambil semua event yang tersedia.
  // Bisa diakses tanpa login (halaman publik).
  // ----------------------------------------------------------
  async getAllEvents() {
    return eventRepository.findAll();
  },
};