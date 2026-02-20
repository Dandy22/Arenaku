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
  // createField
  // Menambahkan lapangan baru ke dalam sebuah venue.
  //
  // PENTING: Ada pengecekan kepemilikan venue.
  // Vendor A tidak boleh menambahkan lapangan ke venue milik Vendor B.
  // Ini adalah celah keamanan yang ada di kode original yang sudah diperbaiki.
  //
  // Parameter:
  //   - userId   : ID user dari JWT token
  //   - userRole : Role user (harus VENDOR)
  //   - data     : Data lapangan yang ingin dibuat
  // ----------------------------------------------------------
  async createField(
    userId: string,
    userRole: string,
    data: {
      name: string;
      type: string;
      price: number;
      venueId: string;
    }
  ) {
    // Rule 1: Hanya VENDOR yang bisa menambah lapangan
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can create a field");
    }

    

    // Rule 2: Validasi data lapangan
    if (!data.name || !data.type || !data.venueId) {
      throw new Error("Name, type, and venueId are required");
    }

    // Rule 3: Harga tidak boleh negatif
    if (data.price < 0) {
      throw new Error("Price cannot be negative");
    }

    // Rule 4: Dapatkan VendorProfile milik user ini
    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) {
      throw new Error("Vendor profile not found");
    }

    if (vendorProfile.status !== "VERIFIED") {
    throw new Error("Your vendor account is not verified yet. Please wait for admin approval.");
    }
    // Rule 5: Cari venue yang dimaksud — pastikan venue ada
    const venue = await venueRepository.findById(data.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    // Rule 6: SECURITY CHECK — pastikan venue ini benar-benar milik vendor ini
    // Tanpa pengecekan ini, Vendor A bisa menambah lapangan ke venue Vendor B!
    if (venue.vendorId !== vendorProfile.id) {
      throw new Error("You are not authorized to add fields to this venue");
    }

    // Semua validasi lolos → buat lapangan baru
    const field = await fieldRepository.create({
      name: data.name,
      type: data.type,
      price: data.price,
      venueId: data.venueId,
    });

    return field;
  },

  // ----------------------------------------------------------
  // getFieldsByVenue
  // Mengambil daftar lapangan dalam satu venue tertentu.
  // Bisa diakses oleh siapapun (publik) untuk melihat lapangan yang tersedia.
  // ----------------------------------------------------------
  async getFieldsByVenue(venueId: string) {
    if (!venueId) {
      throw new Error("venueId is required");
    }
    return fieldRepository.findByVenueId(venueId);
  },
};