import { prisma } from "@/lib/prisma";

export class RatingRepository {
  // CREATE - Tambah rating baru
  async createRating(
    vendorId: string,
    userId: string,
    orderId: string,
    rating: number,
    comment: string = "",
  ) {
    return await prisma.vendorRating.create({
      data: {
        vendorId,
        userId,
        orderId,
        rating,
        comment,
      },
      include: {
        vendor: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: true,
      },
    });
  }

  // READ - Get rating by ID
  async getRatingById(id: string) {
    return await prisma.vendorRating.findUnique({
      where: { id },
      include: {
        vendor: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: true,
      },
    });
  }

  // READ - Get rating by orderId
  async getRatingByOrderId(orderId: string) {
    return await prisma.vendorRating.findUnique({
      where: { orderId },
      include: {
        vendor: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: true,
      },
    });
  }

  // READ - Get all ratings for a vendor
  async getRatingsByVendorId(
    vendorId: string,
    limit: number = 10,
    offset: number = 0,
  ) {
    const [ratings, total] = await Promise.all([
      prisma.vendorRating.findMany({
        where: { vendorId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.vendorRating.count({ where: { vendorId } }),
    ]);

    return { ratings, total };
  }

  // READ - Get ratings by userId (yang dibuat user)
  async getRatingsByUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ) {
    const [ratings, total] = await Promise.all([
      prisma.vendorRating.findMany({
        where: { userId },
        include: {
          vendor: true,
          order: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.vendorRating.count({ where: { userId } }),
    ]);

    return { ratings, total };
  }

  // READ - Get vendor rating stats
  async getVendorRatingStats(vendorId: string) {
    const ratings = await prisma.vendorRating.findMany({
      where: { vendorId },
      select: { rating: true },
    });

    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const totalRatings = ratings.length;
    const averageRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    return {
      totalRatings,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution: distribution,
    };
  }

  // UPDATE - Edit rating
  async updateRating(
    id: string,
    data: {
      rating?: number;
      comment?: string;
    },
  ) {
    return await prisma.vendorRating.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        vendor: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: true,
      },
    });
  }

  // DELETE - Hapus rating
  async deleteRating(id: string) {
    return await prisma.vendorRating.delete({
      where: { id },
    });
  }

  // CHECK - Check if user already rated this vendor/order
  async checkExistingRating(orderId: string) {
    return await prisma.vendorRating.findUnique({
      where: { orderId },
    });
  }
}

export const ratingRepository = new RatingRepository();
