// ============================================================
// lib/repositories/venue.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Venue Repository
// ============================================================

import { prisma } from "@/lib/prisma";

export const venueRepository = {
  findVendorProfileByUserId: (userId: string) =>
    prisma.vendorProfile.findUnique({ where: { userId } }),

  create: (data: {
    name: string;
    description: string;
    city: string;
    address: string;
    latitude?: number;
    longitude?: number;
    vendorId: string;
  }) =>
    prisma.venue.create({
      data: {
        name: data.name,
        description: data.description,
        city: data.city,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        vendorId: data.vendorId,
      },
      include: {
        images: true,
        fields: { include: { images: true, contacts: true } },
      },
    }),

  update: (id: string, data: {
    name?: string;
    description?: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) =>
    prisma.venue.update({
      where: { id },
      data,
      include: {
        images: true,
        fields: { include: { images: true, contacts: true } },
      },
    }),

  deleteById: (id: string) =>
    prisma.venue.delete({ where: { id } }),

  findById: (id: string) =>
    prisma.venue.findUnique({
      where: { id },
      include: {
        fields: {
          include: { images: true, contacts: true },
        },
        images: true,
        ratings: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        vendor: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    }),

  findByVendorId: (vendorId: string) =>
    prisma.venue.findMany({
      where: { vendorId },
      include: {
        fields: { include: { images: true, contacts: true } },
        images: true,
        ratings: true,
      },
      orderBy: { name: "asc" },
    }),

  findAll: async (params: {
    name?: string;
    city?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = params.page || 1;
    const limit = params.limit || 8;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.name) {
      where.name = { contains: params.name, mode: "insensitive" };
    }

    if (params.city) {
      where.city = { contains: params.city, mode: "insensitive" };
    }

    if (params.type) {
      where.fields = {
        some: { type: { contains: params.type, mode: "insensitive" } },
      };
    }

    const [data, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take: limit,
        include: {
          fields: { include: { images: true, contacts: true } },
          images: true,
          ratings: true,
          vendor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.venue.count({ where }),
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

  // Images
  addImage: (venueId: string, url: string) =>
    prisma.venueImage.create({ data: { venueId, url } }),

  deleteImage: (imageId: string) =>
    prisma.venueImage.delete({ where: { id: imageId } }),

  // Ratings
  findRating: (venueId: string, userId: string) =>
    prisma.venueRating.findUnique({
      where: { venueId_userId: { venueId, userId } },
    }),

  createRating: (venueId: string, userId: string, rating: number, comment: string) =>
    prisma.venueRating.create({
      data: { venueId, userId, rating, comment },
    }),

  updateRating: (venueId: string, userId: string, rating: number, comment: string) =>
    prisma.venueRating.update({
      where: { venueId_userId: { venueId, userId } },
      data: { rating, comment },
    }),

  getAverageRating: async (venueId: string) => {
    const result = await prisma.venueRating.aggregate({
      where: { venueId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      average: result._avg.rating || 0,
      count: result._count.rating,
    };
  },
};