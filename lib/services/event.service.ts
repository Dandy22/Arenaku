import { eventRepository } from "@/lib/repositories/event.repository";
import { notificationService } from "@/lib/services/notification.service";

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
      topic?: string;
      imageUrl?: string;
      date: string;
      endDate: string;
      startHour: number;
      endHour: number;
      capacity: number;
      ticketPrice?: number;
      additionalInfo?: string;
      termsConditions?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      latitude?: number;
      longitude?: number;
      status?: "DRAFT" | "ACTIVE";
    },
  ) {
    // 1. Validasi Role (Admin dan Vendor/Staff Vendor boleh buat)
    if (userRole !== "VENDOR" && userRole !== "ADMIN") {
      throw new Error("Unauthorized access");
    }

    // 2. Validasi Field Wajib (Kecuali untuk DRAFT, tapi minimal title harus ada)
    const isDraft = data.status === "DRAFT";
    if (
      !data.title ||
      (!isDraft && (!data.location || !data.date || !data.endDate))
    ) {
      throw new Error(
        "Title, location, and dates are required for active events",
      );
    }

    // 3. FIX: Handle Invalid Date (Fallback ke hari ini jika data kosong/ngaco pas draf)
    const eventDate =
      data.date && data.date !== "-" ? new Date(data.date) : new Date();
    const eventEndDate =
      data.endDate && data.endDate !== "-" ? new Date(data.endDate) : eventDate;

    // Validasi jam hanya jika bukan draf kosong
    if (!isDraft && data.startHour >= data.endHour) {
      throw new Error("Start hour must be earlier than end hour");
    }

    // Cek apakah tanggal valid sebelum lanjut ke Prisma
    if (isNaN(eventDate.getTime()) || isNaN(eventEndDate.getTime())) {
      throw new Error("Invalid Date provided");
    }

    const newEvent = await eventRepository.create({
      title: data.title,
      description: data.description || "",
      location: data.location || "-",
      city: data.city || "Kota Bekasi",
      district: data.district || "",
      category: data.category || "",
      topic: data.topic || "-",
      imageUrl: data.imageUrl || "",
      date: eventDate,
      endDate: eventEndDate,
      startHour: Number(data.startHour) || 0,
      endHour: Number(data.endHour) || 0,
      capacity: Number(data.capacity) || 0,
      creatorId,
      additionalInfo: data.additionalInfo || "",
      termsConditions: data.termsConditions || "",
      contactName: data.contactName || "-",
      contactEmail: data.contactEmail || "-",
      contactPhone: data.contactPhone || "-",
      latitude: data.latitude,
      longitude: data.longitude,
      status: data.status || "ACTIVE",
    });

    // Kirim notifikasi hanya jika statusnya ACTIVE
    if (newEvent.status === "ACTIVE") {
      await notificationService.notifyEventNew(newEvent.id);
    }

    return newEvent;
  },

  async updateEventStatus(
    eventId: string,
    userId: string,
    userRole: string,
    newStatus: any,
  ) {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new Error("Event not found");

    if (userRole !== "ADMIN" && event.creatorId !== userId) {
      throw new Error("You are not authorized to update this event");
    }

    return eventRepository.updateStatus(eventId, newStatus);
  },

  async deleteEvent(eventId: string, userId: string, userRole: string) {
    const event = await eventRepository.findById(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // --- PERBAIKAN LOGIC IZIN DI SINI ---
    let isAuthorized = false;

    if (userRole === "ADMIN") {
      isAuthorized = true;
    } else if (event.creatorId === userId) {
      isAuthorized = true;
    } else {
      // Jika dia staff, cek apakah dia satu vendor sama pembuatnya
      // Kita panggil repository findByVendor buat ngecek membership
      const userVendorEvents = await eventRepository.findByVendor(userId);
      // Jika event yang mau dihapus ada di daftar event vendor si user, berarti boleh
      isAuthorized = userVendorEvents.some((e: any) => e.id === eventId);
    }

    if (!isAuthorized) {
      throw new Error("You are not authorized to delete this event");
    }

    // Hapus dari database via repository
    return eventRepository.delete(eventId);
  },

  async joinEvent(userId: string, eventId: string) {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new Error("Event not found");

    if (event.status === "CANCELLED")
      throw new Error("Event has been cancelled");

    if (event.participants.length >= event.capacity) {
      throw new Error(`Event is full`);
    }

    const alreadyJoined = await eventRepository.findParticipant(
      eventId,
      userId,
    );
    if (alreadyJoined) throw new Error("You have already joined this event");

    return eventRepository.addParticipant(eventId, userId);
  },

  async cancelEvent(eventId: string, userId: string, userRole: string) {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new Error("Event not found");

    if (userRole !== "ADMIN" && event.creatorId !== userId) {
      throw new Error("You are not authorized to cancel this event");
    }

    return eventRepository.updateStatus(eventId, "CANCELLED");
  },

  async getEventById(id: string) {
    const event = await eventRepository.findById(id);
    if (!event) throw new Error("Event not found");
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

  async getVendorEvents(userId: string) {
    // Sesuai request: Staff/Owner bisa liat event satu vendor
    return eventRepository.findByVendor(userId);
  },

  async getAdminEvents() {
    return eventRepository.findAllAdmin();
  },
};
