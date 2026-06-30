import { fieldRepository } from "@/lib/repositories/field.repository";
import { venueRepository } from "@/lib/repositories/venue.repository";

export const fieldService = {
  async verifyFieldOwnership(userId: string, fieldId: string) {
    // GANTI: Cari organisasi vendor tempat user bernaung
    const vendorOrg = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorOrg) throw new Error("Vendor organization not found");

    const field = await fieldRepository.findById(fieldId);
    if (!field) throw new Error("Field not found");

    // Bandingkan dengan vendorId organisasi
    if (field.venue.vendorId !== vendorOrg.id) {
      throw new Error("You are not authorized to modify this field");
    }

    return { vendorOrg, field };
  },

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
      thumbnailUrl?: string;
      images?: { url: string; title: string }[];
    },
  ) {
    if (userRole !== "VENDOR")
      throw new Error("Only vendors can create a field");

    if (data.price < 0) throw new Error("Price cannot be negative");

    // Ambil data organisasi vendor
    const vendorOrg = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorOrg) throw new Error("Vendor organization not found");

    if (vendorOrg.status !== "VERIFIED") {
      throw new Error("Your vendor account is not verified yet.");
    }

    const venue = await venueRepository.findById(data.venueId);
    if (!venue) throw new Error("Venue not found");

    // Pastikan venue tersebut milik organisasi vendor si user
    if (venue.vendorId !== vendorOrg.id) {
      throw new Error("You are not authorized to add fields to this venue");
    }

    return fieldRepository.create({
      ...data,
      floorType: data.floorType || "",
      length: data.length || 0,
      width: data.width || 0,
      description: data.description || "",
      thumbnailUrl: data.thumbnailUrl || "",
      images: data.images || [],
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
      thumbnailUrl?: string;
      images?: { url: string; title: string }[];
    },
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

  async addImage(
    userId: string,
    userRole: string,
    fieldId: string,
    url: string,
    title: string,
  ) {
    if (userRole !== "VENDOR") throw new Error("Only vendors can add images");
    await this.verifyFieldOwnership(userId, fieldId);
    return fieldRepository.addImage(fieldId, url, title); // Kirim title ke repository
  },

  async deleteImage(
    userId: string,
    userRole: string,
    fieldId: string,
    imageId: string,
  ) {
    if (userRole !== "VENDOR")
      throw new Error("Only vendors can delete images");
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
    },
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
    },
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
