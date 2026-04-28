import { eventRepository } from "@/lib/repositories/event.repository";

export const eventService = {
  async createEvent(
    creatorId: string,
    userRole: string,
    data: {
      title: string;
      description: string;
      location: string;
      city?: string;
      district?: string;
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
    // Hanya vendor yang boleh membuat event
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can create events");
    }

    // Validasi field wajib
    if (!data.title || !data.location || !data.date) {
      throw new Error("Title, location, and date are required");
    }

    // Validasi kapasitas
    if (data.capacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }

    // Validasi harga tiket
    if (data.ticketPrice < 0) {
      throw new Error("Ticket price cannot be negative");
    }

    // Validasi jam event
    if (data.startHour >= data.endHour) {
      throw new Error("Start hour must be earlier than end hour");
    }

    // Validasi tanggal event
    const eventDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      throw new Error("Event date cannot be in the past");
    }

    // Simpan ke database
    return eventRepository.create({
      title: data.title,
      description: data.description,
      location: data.location,
      city: data.city || "Kota Bekasi",
      district: data.district || "",
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
    // Cari event
    const event = await eventRepository.findById(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // Cek event sudah dibatalkan atau belum
    if (event.status === "CANCELLED") {
      throw new Error("Event has been cancelled");
    }

    // Cek kapasitas penuh
    if (event.participants.length >= event.capacity) {
      throw new Error(
        `Event is full (${event.participants.length}/${event.capacity} participants)`
      );
    }

    // Cegah join dua kali
    const alreadyJoined = await eventRepository.findParticipant(
      eventId,
      userId
    );

    if (alreadyJoined) {
      throw new Error("You have already joined this event");
    }

    // Tambahkan participant
    return eventRepository.addParticipant(eventId, userId);
  },

  async cancelEvent(eventId: string, userId: string, userRole: string) {
    const event = await eventRepository.findById(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // Hanya vendor (creator) atau admin yang boleh membatalkan
    if (userRole !== "ADMIN" && event.creatorId !== userId) {
      throw new Error("You are not authorized to cancel this event");
    }

    return eventRepository.updateStatus(eventId, "CANCELLED");
  },

  async getEventById(id: string) {
    const event = await eventRepository.findById(id);

    if (!event) {
      throw new Error("Event not found");
    }

    return event;
  },

  async getAllEvents(params: {
    category?: string;
    city?: string;
    district?: string;
    page?: number;
    limit?: number;
  }) {
    return eventRepository.findAll(params);
  },

  async getVendorEvents(vendorId: string) {
    return eventRepository.findByVendor(vendorId);
  },

  async getAdminEvents() {
    return eventRepository.findAllAdmin();
  },
};