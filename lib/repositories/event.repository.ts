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
  create: (data: {
    title: string;
    description: string;
    location: string;
    city: string;
    district: string;
    category: string;
    imageUrl: string;
    date: Date;
    startHour: number;
    endHour: number;
    ticketPrice: number;
    capacity: number;
    creatorId: string;
    additionalInfo: string;
    termsConditions: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    latitude?: number;
    longitude?: number;
  }) =>
    prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        city: data.city,
        district: data.district,
        category: data.category,
        imageUrl: data.imageUrl,
        date: data.date,
        startHour: data.startHour,
        endHour: data.endHour,
        ticketPrice: data.ticketPrice,
        capacity: data.capacity,
        creatorId: data.creatorId,
        additionalInfo: data.additionalInfo,
        termsConditions: data.termsConditions,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      include: {
        participants: true,
        creator: { select: { id: true, name: true, email: true } },
      },
    }),

  findById: (id: string) =>
    prisma.event.findUnique({
      where: { id },
      include: {
        participants: true,
        creator: { select: { id: true, name: true, email: true } },
      },
    }),

  findAll: async (params: {
    category?: string;
    city?: string;
    district?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = params.page || 1;
    const limit = params.limit || 8;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.category) {
      where.category = { contains: params.category, mode: "insensitive" };
    }
    if (params.city) {
      where.city = { contains: params.city, mode: "insensitive" };
    }
    if (params.district) {
      where.district = { contains: params.district, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          participants: true,
          creator: { select: { id: true, name: true } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  findByVendor: async (vendorId: string) => {
    const vendorProfile = await prisma.vendorProfile.findFirst({
      where: { userId: vendorId },
    });

    if (!vendorProfile) {
      return [];
    }

    return prisma.event.findMany({
      where: { creatorId: vendorId },
      include: {
        participants: true,
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findAllAdmin: async () => {
    return prisma.event.findMany({
      include: {
        participants: true,
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  updateStatus: (id: string, status: "ACTIVE" | "CANCELLED" | "COMPLETED") =>
    prisma.event.update({
      where: { id },
      data: { status },
      include: {
        participants: true,
        creator: { select: { id: true, name: true, email: true } },
      },
    }),

  findParticipant: (eventId: string, userId: string) =>
    prisma.eventParticipant.findFirst({
      where: { eventId, userId },
    }),

  addParticipant: (eventId: string, userId: string) =>
    prisma.eventParticipant.create({
      data: { eventId, userId },
    }),
};