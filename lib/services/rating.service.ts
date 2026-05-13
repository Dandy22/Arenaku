import { ratingRepository } from "@/lib/repositories/rating.repository";
import { orderRepository } from "@/lib/repositories/order.repository";
import { prisma } from "@/lib/prisma";

export class RatingService {
  // Create rating dengan validasi
  async createRating(
    userId: string,
    orderId: string,
    rating: number,
    comment: string = "",
  ) {
    // Validasi rating (1-5)
    if (rating < 1 || rating > 5) {
      throw new Error("Rating harus antara 1-5");
    }

    // Cari order
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order tidak ditemukan");
    }

    // Validasi owner order
    if (order.userId !== userId) {
      throw new Error("Anda tidak bisa memberi rating ke order orang lain");
    }

    // Validasi order status (harus sudah PAID)
    if (order.status !== "PAID") {
      throw new Error(
        "Hanya bisa memberi rating untuk order yang sudah dibayar",
      );
    }

    // Check if order has refund request
    // if (order.status === "REFUND_REQUESTED") {
    //   throw new Error("Cannot rate orders that have refund requests");
    // }

    // Check if rating sudah ada
    const existingRating = await ratingRepository.checkExistingRating(orderId);
    if (existingRating) {
      throw new Error("Anda sudah memberi rating untuk order ini");
    }

    // Cari vendor dari order items
    const orderItem = order.items[0]; // Ambil item pertama
    if (!orderItem) {
      throw new Error("Order tidak memiliki item");
    }

    const field = await prisma.field.findUnique({
      where: { id: orderItem.fieldId },
      include: { venue: true },
    });

    if (!field) {
      throw new Error("Field tidak ditemukan");
    }

    const vendorId = field.venue.vendorId;
    const venueId = field.venue.id;

    // Buat rating untuk vendor
    const newVendorRating = await ratingRepository.createRating(
      vendorId,
      userId,
      orderId,
      rating,
      comment,
    );

    // Buat rating untuk venue juga
    const newVenueRating = await prisma.venueRating.create({
      data: {
        venueId,
        userId,
        rating,
        comment,
      },
      include: {
        venue: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return newVendorRating;
  }

  // Get rating by ID
  async getRatingById(id: string) {
    return await ratingRepository.getRatingById(id);
  }

  // Get ratings for vendor
  async getRatingsByVendorId(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;
    return await ratingRepository.getRatingsByVendorId(vendorId, limit, offset);
  }

  // Get ratings by user
  async getRatingsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;
    return await ratingRepository.getRatingsByUserId(userId, limit, offset);
  }

  // Get vendor rating stats
  async getVendorRatingStats(vendorId: string) {
    return await ratingRepository.getVendorRatingStats(vendorId);
  }

  // Update rating
  async updateRating(
    ratingId: string,
    userId: string,
    data: {
      rating?: number;
      comment?: string;
    },
  ) {
    // Validasi owner rating
    const rating = await ratingRepository.getRatingById(ratingId);
    if (!rating) {
      throw new Error("Rating tidak ditemukan");
    }

    if (rating.user.id !== userId) {
      throw new Error("Anda tidak bisa mengubah rating orang lain");
    }

    // Validasi rating value
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new Error("Rating harus antara 1-5");
    }

    return await ratingRepository.updateRating(ratingId, data);
  }

  // Delete rating
  async deleteRating(ratingId: string, userId: string) {
    // Validasi owner rating
    const rating = await ratingRepository.getRatingById(ratingId);
    if (!rating) {
      throw new Error("Rating tidak ditemukan");
    }

    if (rating.user.id !== userId) {
      throw new Error("Anda tidak bisa menghapus rating orang lain");
    }

    return await ratingRepository.deleteRating(ratingId);
  }

  // Check if order can be rated
  async canUserRateOrder(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) return false;
    if (order.userId !== userId) return false;
    if (order.status !== "PAID") return false;

    const existing = await ratingRepository.checkExistingRating(orderId);
    if (existing) return false;

    return true;
  }
}

export const ratingService = new RatingService();
