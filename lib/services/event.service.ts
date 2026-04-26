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
  async createEvent(
    creatorId: string,
    data: {
      title: string;
      description: string;
      location: string;
      city?: string;
      category?: string;
      imageUrl?: string;
      date: string;
      startHour: number;
      endHour: number;
      ticketPrice: number;
      capacity: number;
      additionalInfo?: string;
      termsConditions?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      latitude?: number;
      longitude?: number;
    }
  ) {
    if (!data.title || !data.location || !data.date) {
      throw new Error("Title, location, and date are required");
    }
    if (data.capacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }
    if (data.ticketPrice < 0) {
      throw new Error("Ticket price cannot be negative");
    }
    if (data.startHour >= data.endHour) {
      throw new Error("Start hour must be earlier than end hour");
    }

    const eventDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      throw new Error("Event date cannot be in the past");
    }

    return eventRepository.create({
      title: data.title,
      description: data.description,
      location: data.location,
      city: data.city || "",
      category: data.category || "",
      imageUrl: data.imageUrl || "",
      date: eventDate,
      startHour: data.startHour,
      endHour: data.endHour,
      ticketPrice: data.ticketPrice,
      capacity: data.capacity,
      creatorId,
      additionalInfo: data.additionalInfo || "",
      termsConditions: data.termsConditions || "",
      contactName: data.contactName || "",
      contactEmail: data.contactEmail || "",
      contactPhone: data.contactPhone || "",
      latitude: data.latitude,
      longitude: data.longitude,
    });
  },

  async joinEvent(userId: string, eventId: string) {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new Error("Event not found");

    if (event.participants.length >= event.capacity) {
      throw new Error(
        `Event is full (${event.participants.length}/${event.capacity} participants)`
      );
    }

    const alreadyJoined = await eventRepository.findParticipant(eventId, userId);
    if (alreadyJoined) throw new Error("You have already joined this event");

    return eventRepository.addParticipant(eventId, userId);
  },

  async getEventById(id: string) {
    const event = await eventRepository.findById(id);
    if (!event) throw new Error("Event not found");
    return event;
  },

  async getAllEvents(params: {
    category?: string;
    city?: string;
    page?: number;
    limit?: number;
  }) {
    return eventRepository.findAll(params);
  },
};