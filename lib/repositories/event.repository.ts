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
        ticketTiers: true,
      },
    }),

  delete: (id: string) =>
    prisma.event.delete({
      where: { id },
    }),

  findAll: async (params: {
    name?: string;
    category?: string;
    eventType?: string;
    city?: string;
    district?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = params.page || 1;
    const limit = params.limit || 8;
    const skip = (page - 1) * limit;

    //   PERBAIKAN: Gunakan Waktu Sekarang persis (Bukan 00:00) agar event yg berlangsung hari ini tidak terhapus duluan.
    const now = new Date();

    //   FILTER UTAMA: Status ACTIVE dan Belum Lewat Waktu
    const where: any = {
      status: "ACTIVE",
      endDate: {
        gte: now, // Hanya tampilkan event yang selesainya lebih besar dari waktu sekarang
      },
    };

    const filters: any[] = [];

    // Cari jenis olahraga (Basket, Sepak Bola) di kolom topic ATAU category
    if (params.category) {
      filters.push({
        OR: [
          { topic: { contains: params.category, mode: "insensitive" } },
          { category: { contains: params.category, mode: "insensitive" } },
        ],
      });
    }

    // Cari tipe event (Turnamen/Olahraga) di kolom category ATAU topic
    if (params.eventType) {
      const mappedType =
        params.eventType === "TURNAMEN"
          ? "TOURNAMENT"
          : params.eventType === "OLAHRAGA"
            ? "SPORTS"
            : params.eventType;

      filters.push({
        OR: [
          { category: { contains: mappedType, mode: "insensitive" } },
          { topic: { contains: mappedType, mode: "insensitive" } },
        ],
      });
    }

    if (params.name) {
      filters.push({
        OR: [
          { title: { contains: params.name, mode: "insensitive" } },
          { location: { contains: params.name, mode: "insensitive" } },
          { topic: { contains: params.name, mode: "insensitive" } },
        ],
      });
    }

    if (params.city) {
      filters.push({ city: { contains: params.city, mode: "insensitive" } });
    }

    if (params.district) {
      filters.push({
        district: { contains: params.district, mode: "insensitive" },
      });
    }

    if (filters.length > 0) {
      where.AND = filters;
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
        orderBy: { date: "asc" }, // Urutkan dari yang paling dekat waktunya
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
