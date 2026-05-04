// ============================================================
// lib/repositories/event.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Event Repository
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
    topic: string;
    imageUrl: string;
    date: Date;
    endDate: Date;
    startHour: number;
    endHour: number;
    capacity: number;
    creatorId: string;
    additionalInfo: string;
    termsConditions: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    latitude?: number;
    longitude?: number;
    status: "DRAFT" | "ACTIVE";
  }) =>
    prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        city: data.city,
        district: data.district,
        category: data.category,
        topic: data.topic,
        imageUrl: data.imageUrl,
        date: data.date,
        endDate: data.endDate,
        startHour: data.startHour,
        endHour: data.endHour,
        capacity: data.capacity,
        creatorId: data.creatorId,
        additionalInfo: data.additionalInfo,
        termsConditions: data.termsConditions,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
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

  delete: (id: string) =>
    prisma.event.delete({
      where: { id },
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

    // --- FIX: Hanya tampilkan status ACTIVE ke publik ---
    const where: any = {
      status: "ACTIVE",
    };

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

  findByVendor: async (userId: string) => {
    // 1. Cari dulu vendorId di mana user ini menjadi member (bisa Owner atau Staff)
    const membership = await prisma.vendorMember.findFirst({
      where: { userId: userId },
      select: { vendorId: true },
    });

    if (!membership) {
      return [];
    }

    // 2. Ambil semua event yang dibuat oleh siapapun yang berada di vendor yang sama
    return prisma.event.findMany({
      where: {
        creator: {
          vendorMemberships: {
            some: {
              vendorId: membership.vendorId,
            },
          },
        },
      },
      include: {
        participants: true,
        creator: { select: { id: true, name: true } },
        ticketTiers: true,
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
