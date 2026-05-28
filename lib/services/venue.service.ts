import { venueRepository } from "@/lib/repositories/venue.repository";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification.service";

export const venueService = {
  async createVenue(
    userId: string,
    userRole: string,
    data: {
      name: string;
      description: string;
      city: string;
      district?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      thumbnailUrl?: string;
      openHour?: number;
      closeHour?: number;
      isOpen?: boolean;
    },
  ) {
    if (userRole !== "VENDOR")
      throw new Error("Only vendors can create a venue");
    const vendorOrg = await venueRepository.findVendorProfileByUserId(userId);

    if (!vendorOrg) throw new Error("Vendor organization not found.");

    if (vendorOrg.status !== "VERIFIED") {
      throw new Error("Your vendor account is not verified yet.");
    }

    return venueRepository.create({
      ...data,
      district: data.district || "",
      address: data.address || "",
      vendorId: vendorOrg.id, // Gunakan ID Organisasi
      thumbnailUrl: data.thumbnailUrl || "",
      openHour: data.openHour,
      closeHour: data.closeHour,
      isOpen: data.isOpen ?? true,
    });
  },

  async updateVenue(
    userId: string,
    userRole: string,
    venueId: string,
    data: any,
  ) {
    if (userRole !== "VENDOR")
      throw new Error("Only vendors can update a venue");

    const vendorOrg = await venueRepository.findVendorProfileByUserId(userId);
    const venue = await venueRepository.findById(venueId);

    if (!venue) throw new Error("Venue not found");
    if (!vendorOrg || venue.vendorId !== vendorOrg.id) {
      throw new Error("You are not authorized to update this venue");
    }

    return venueRepository.update(venueId, data);
  },

  async deleteVenue(userId: string, userRole: string, venueId: string) {
    if (userRole !== "VENDOR")
      throw new Error("Only vendors can delete a venue");

    const vendorOrg = await venueRepository.findVendorProfileByUserId(userId);
    const venue = await venueRepository.findById(venueId);

    if (!venue) throw new Error("Venue not found");
    if (!vendorOrg || venue.vendorId !== vendorOrg.id) {
      throw new Error("You are not authorized to delete this venue");
    }

    return venueRepository.deleteById(venueId);
  },

  async getVendorVenues(userId: string, userRole: string) {
    if (userRole !== "VENDOR")
      throw new Error("Only vendors can view their venues");
    const vendorOrg = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorOrg) throw new Error("Vendor organization not found");
    return venueRepository.findByVendorId(vendorOrg.id);
  },

  async getVenueById(id: string) {
    const venue = await venueRepository.findById(id);
    if (!venue) throw new Error("Venue not found");

    const ratingInfo = await venueRepository.getAverageRating(id);
    return {
      ...venue,
      averageRating: ratingInfo.average,
      ratingCount: ratingInfo.count,
    };
  },

  async getAllVenues(params: {
    name?: string;
    city?: string;
    district?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    return venueRepository.findAll(params);
  },

  async addImage(
    userId: string,
    userRole: string,
    venueId: string,
    url: string,
    title?: string,
  ) {
    if (userRole !== "VENDOR" && userRole !== "ADMIN")
      throw new Error("Only vendors and admins can add images");

    const vendorProfile =
      await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    const venue = await venueRepository.findById(venueId);
    if (!venue) throw new Error("Venue not found");

    if (venue.vendorId !== vendorProfile.id) {
      throw new Error("You are not authorized to add images to this venue");
    }

    return venueRepository.addImage(venueId, url, title);
  },

  async deleteImage(
    userId: string,
    userRole: string,
    venueId: string,
    imageId: string,
  ) {
    if (userRole !== "VENDOR" && userRole !== "ADMIN")
      throw new Error("Only vendors and admins can delete images");

    const vendorProfile =
      await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    const venue = await venueRepository.findById(venueId);
    if (!venue) throw new Error("Venue not found");

    if (venue.vendorId !== vendorProfile.id) {
      throw new Error(
        "You are not authorized to delete images from this venue",
      );
    }

    return venueRepository.deleteImage(imageId);
  },

  async rateVenue(
    userId: string,
    venueId: string,
    rating: number,
    comment: string,
  ) {
    if (rating < 1 || rating > 5)
      throw new Error("Rating must be between 1 and 5");

    const venue = await venueRepository.findById(venueId);
    if (!venue) throw new Error("Venue not found");

    // Cek apakah user pernah booking di venue ini dan sudah PAID
    const hasPaidBooking = await prisma.orderItem.findFirst({
      where: {
        field: { venueId },
        order: {
          userId,
          status: "PAID",
        },
      },
    });

    if (!hasPaidBooking) {
      throw new Error(
        "You can only rate a venue after completing a booking there",
      );
    }

    const existing = await venueRepository.findRating(venueId, userId);
    let result;
    if (existing) {
      result = await venueRepository.updateRating(
        venueId,
        userId,
        rating,
        comment,
      );
    } else {
      result = await venueRepository.createRating(
        venueId,
        userId,
        rating,
        comment,
      );
      // Trigger notifikasi Rating Baru ke vendor
      await notificationService.notifyRatingNew(venueId);
    }
    return result;
  },
};
