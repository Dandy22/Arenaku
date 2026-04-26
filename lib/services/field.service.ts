// ============================================================
// lib/services/field.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic Layer: Field (Lapangan) Service
//
// Logika bisnis untuk manajemen lapangan:
//   - Hanya VENDOR yang bisa menambah lapangan
//   - Vendor hanya bisa menambah lapangan ke VENUE MILIKNYA SENDIRI
//     (bukan venue milik vendor lain) — ini adalah security rule penting!
//   - Validasi harga tidak boleh negatif
// ============================================================
import { fieldRepository } from "@/lib/repositories/field.repository";
import { venueRepository } from "@/lib/repositories/venue.repository";

export const fieldService = {
  // ----------------------------------------------------------
  // Helper: verifikasi vendor adalah pemilik field ini
  // ----------------------------------------------------------
  async verifyFieldOwnership(userId: string, fieldId: string) {
    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    const field = await fieldRepository.findById(fieldId);
    if (!field) throw new Error("Field not found");

    if (field.venue.vendorId !== vendorProfile.id) {
      throw new Error("You are not authorized to modify this field");
    }

    return { vendorProfile, field };
  },

  // ----------------------------------------------------------
  // createField
  // ----------------------------------------------------------
  async createField(
    userId: string,
    userRole: string,
    data: {
      name: string;
      type: string;
      floorType?: string;
      length?: number;
      width?: number;
      price: number;
      description?: string;
      venueId: string;
    }
  ) {
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can create a field");
    }

    if (!data.name || !data.type || !data.venueId) {
      throw new Error("Name, type, and venueId are required");
    }

    if (data.price < 0) {
      throw new Error("Price cannot be negative");
    }

    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    if (vendorProfile.status !== "VERIFIED") {
      throw new Error("Your vendor account is not verified yet. Please wait for admin approval.");
    }

    const venue = await venueRepository.findById(data.venueId);
    if (!venue) throw new Error("Venue not found");

    if (venue.vendorId !== vendorProfile.id) {
      throw new Error("You are not authorized to add fields to this venue");
    }

    return fieldRepository.create({
      name: data.name,
      type: data.type,
      floorType: data.floorType || "",
      length: data.length || 0,
      width: data.width || 0,
      price: data.price,
      description: data.description || "",
      venueId: data.venueId,
    });
  },

  // ----------------------------------------------------------
  // updateField
  // ----------------------------------------------------------
  async updateField(
    userId: string,
    userRole: string,
    fieldId: string,
    data: {
      name?: string;
      type?: string;
      floorType?: string;
      length?: number;
      width?: number;
      price?: number;
      description?: string;
    }
  ) {
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can update a field");
    }

    if (data.price !== undefined && data.price < 0) {
      throw new Error("Price cannot be negative");
    }

    await this.verifyFieldOwnership(userId, fieldId);

    return fieldRepository.update(fieldId, data);
  },

  // ----------------------------------------------------------
  // deleteField
  // ----------------------------------------------------------
  async deleteField(userId: string, userRole: string, fieldId: string) {
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can delete a field");
    }

    await this.verifyFieldOwnership(userId, fieldId);

    return fieldRepository.deleteById(fieldId);
  },

  // ----------------------------------------------------------
  // getFieldsByVenue
  // ----------------------------------------------------------
  async getFieldsByVenue(venueId: string) {
    if (!venueId) throw new Error("venueId is required");
    return fieldRepository.findByVenueId(venueId);
  },

  // ----------------------------------------------------------
  // getFieldById
  // ----------------------------------------------------------
  async getFieldById(fieldId: string) {
    const field = await fieldRepository.findById(fieldId);
    if (!field) throw new Error("Field not found");
    return field;
  },

  async addImage(userId: string, userRole: string, fieldId: string, url: string) {
  if (userRole !== "VENDOR") throw new Error("Only vendors can add images");
  await this.verifyFieldOwnership(userId, fieldId);
  return fieldRepository.addImage(fieldId, url);
},

async deleteImage(userId: string, userRole: string, fieldId: string, imageId: string) {
  if (userRole !== "VENDOR") throw new Error("Only vendors can delete images");
  await this.verifyFieldOwnership(userId, fieldId);
  return fieldRepository.deleteImage(imageId);
},

  // ----------------------------------------------------------
  // addContact
  // ----------------------------------------------------------
  async addContact(
    userId: string,
    userRole: string,
    fieldId: string,
    data: {
      name: string;
      email?: string;
      phone?: string;
    }
  ) {
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can add contacts");
    }

    if (!data.name) throw new Error("Contact name is required");

    await this.verifyFieldOwnership(userId, fieldId);

    return fieldRepository.addContact(fieldId, data);
  },

  // ----------------------------------------------------------
  // updateContact
  // ----------------------------------------------------------
  async updateContact(
    userId: string,
    userRole: string,
    contactId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
    }
  ) {
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can update contacts");
    }

    // Verifikasi via field yang dimiliki contact ini
    const contact = await fieldRepository.findContact(contactId);
    if (!contact) throw new Error("Contact not found");

    await this.verifyFieldOwnership(userId, contact.fieldId);

    return fieldRepository.updateContact(contactId, data);
  },

  // ----------------------------------------------------------
  // deleteContact
  // ----------------------------------------------------------
  async deleteContact(userId: string, userRole: string, contactId: string) {
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can delete contacts");
    }

    const contact = await fieldRepository.findContact(contactId);
    if (!contact) throw new Error("Contact not found");

    await this.verifyFieldOwnership(userId, contact.fieldId);

    return fieldRepository.deleteContact(contactId);
  },
};