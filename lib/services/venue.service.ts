import { venueRepository } from "@/lib/repositories/venue.repository";
import { prisma } from "@/lib/prisma";

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
    }
  ) {
    if (userRole !== "VENDOR") throw new Error("Only vendors can create a venue");
    if (!data.name || !data.description || !data.city) {
      throw new Error("Name, description, and city are required");
    }

    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found. Please contact support");
    if (vendorProfile.status !== "VERIFIED") {
      throw new Error("Your vendor account is not verified yet. Please wait for admin approval.");
    }

    return venueRepository.create({
      name: data.name,
      description: data.description,
      city: data.city,
      district: data.district || "",
      address: data.address || "",
      latitude: data.latitude,
      longitude: data.longitude,
      vendorId: vendorProfile.id,
    });
  },

  async updateVenue(
    userId: string,
    userRole: string,
    venueId: string,
    data: {
      name?: string;
      description?: string;
      city?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    }
  ) {
    if (userRole !== "VENDOR") throw new Error("Only vendors can update a venue");

    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    const venue = await venueRepository.findById(venueId);
    if (!venue) throw new Error("Venue not found");

    if (venue.vendorId !== vendorProfile.id) {
      throw new Error("You are not authorized to update this venue");
    }

    return venueRepository.update(venueId, data);
  },

  async deleteVenue(userId: string, userRole: string, venueId: string) {
    if (userRole !== "VENDOR") throw new Error("Only vendors can delete a venue");

    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    const venue = await venueRepository.findById(venueId);
    if (!venue) throw new Error("Venue not found");

    if (venue.vendorId !== vendorProfile.id) {
      throw new Error("You are not authorized to delete this venue");
    }

    return venueRepository.deleteById(venueId);
  },

  async getVendorVenues(userId: string, userRole: string) {
    if (userRole !== "VENDOR") throw new Error("Only vendors can view their venues");

    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    return venueRepository.findByVendorId(vendorProfile.id);
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

  async addImage(userId: string, userRole: string, venueId: string, url: string) {
    if (userRole !== "VENDOR") throw new Error("Only vendors can add images");

    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    const venue = await venueRepository.findById(venueId);
    if (!venue) throw new Error("Venue not found");

    if (venue.vendorId !== vendorProfile.id) {
      throw new Error("You are not authorized to add images to this venue");
    }

    return venueRepository.addImage(venueId, url);
  },

  async deleteImage(userId: string, userRole: string, venueId: string, imageId: string) {
    if (userRole !== "VENDOR") throw new Error("Only vendors can delete images");

    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    const venue = await venueRepository.findById(venueId);
    if (!venue) throw new Error("Venue not found");

    if (venue.vendorId !== vendorProfile.id) {
      throw new Error("You are not authorized to delete images from this venue");
    }

    return venueRepository.deleteImage(imageId);
  },

 async rateVenue(userId: string, venueId: string, rating: number, comment: string) {
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

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
    throw new Error("You can only rate a venue after completing a booking there");
  }

  const existing = await venueRepository.findRating(venueId, userId);
  if (existing) {
    return venueRepository.updateRating(venueId, userId, rating, comment);
  }
  return venueRepository.createRating(venueId, userId, rating, comment);
},
};