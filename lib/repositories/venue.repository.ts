import { prisma } from "@/lib/prisma";

export const venueRepository = {
  findVendorProfileByUserId: async (userId: string) => {
    // Cari member, lalu ambil data Vendor-nya
    const membership = await prisma.vendorMember.findFirst({
      where: { userId },
      include: { vendor: true },
    });
    return membership?.vendor || null;
  },

  create: (data: {
    name: string;
    description: string;
    city: string;
    district?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    vendorId: string;
    thumbnailUrl?: string;
    //   TAMBAHKAN TYPE DI SINI
    openHour?: number;
    closeHour?: number;
    isOpen?: boolean;
  }) =>
    prisma.venue.create({
      data: {
        name: data.name,
        description: data.description,
        city: data.city,
        district: data.district || "",
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        vendorId: data.vendorId,
        thumbnailUrl: data.thumbnailUrl || "",
        //   PASTIKAN DIKIRIM KE PRISMA
        openHour: data.openHour,
        closeHour: data.closeHour,
        isOpen: data.isOpen ?? true,
      },
      include: {
        images: true,
        fields: { include: { images: true, contacts: true } },
      },
    }),
  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      city?: string;
      district?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      thumbnailUrl?: string;
      //   TAMBAHKAN TYPE DI SINI
      openHour?: number;
      closeHour?: number;
      isOpen?: boolean;
    },
  ) =>
    prisma.venue.update({
      where: { id },
      data,
      include: {
        images: true,
        fields: { include: { images: true, contacts: true } },
      },
    }),

  deleteById: (id: string) => prisma.venue.delete({ where: { id } }),

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
            members: {
              where: {
                role: "OWNER",
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

  findByVendorId: async (vendorId: string) => {
    // Langsung cari semua venue berdasarkan vendorId organisasi
    return prisma.venue.findMany({
      where: { vendorId: vendorId },
      include: {
        fields: {
          include: { images: true, contacts: true },
        },
        images: true,
        ratings: true,
      },
      orderBy: { name: "asc" },
    });
  },

  findAll: async (params: {
    name?: string;
    city?: string;
    district?: string;
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

    if (params.district) {
      where.district = { contains: params.district, mode: "insensitive" };
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
              members: {
                where: {
                  role: "OWNER",
                },
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
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

  addImage: (venueId: string, url: string, title?: string) =>
    prisma.venueImage.create({
      data: {
        venueId,
        url,
        title: title || "",
      },
    }),

  deleteImage: (imageId: string) =>
    prisma.venueImage.delete({ where: { id: imageId } }),

  // ==========================================
  // PERBAIKAN DI BAGIAN RATING:
  // Menggunakan findFirst karena VenueRating
  // tidak memiliki @@unique([venueId, userId])
  // ==========================================
  findRating: (venueId: string, userId: string) =>
    prisma.venueRating.findFirst({
      where: { venueId, userId },
    }),

  createRating: (
    venueId: string,
    userId: string,
    rating: number,
    comment: string,
  ) =>
    prisma.venueRating.create({
      data: { venueId, userId, rating, comment },
    }),

  updateRating: async (
    venueId: string,
    userId: string,
    rating: number,
    comment: string,
  ) => {
    // Cari ID rating-nya terlebih dahulu
    const existingRating = await prisma.venueRating.findFirst({
      where: { venueId, userId },
    });

    if (!existingRating) {
      throw new Error("Rating not found");
    }

    // Update berdasarkan ID yang ditemukan
    return prisma.venueRating.update({
      where: { id: existingRating.id },
      data: { rating, comment },
    });
  },

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
