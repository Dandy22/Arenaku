// ============================================================
// lib/services/venue.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic Layer: Venue Service
//
// Logika bisnis untuk manajemen venue (tempat/gedung olahraga):
//   - Hanya VENDOR yang bisa membuat venue
//   - VENDOR harus punya profil vendor terlebih dahulu
//   - Validasi data venue sebelum disimpan
// ============================================================

import { venueRepository } from "@/lib/repositories/venue.repository";

export const venueService = {
  // ----------------------------------------------------------
  // createVenue
  // Membuat venue baru yang dimiliki oleh vendor yang sedang login.
  //
  // Parameter:
  //   - userId   : ID user dari JWT token
  //   - userRole : Role user (harus VENDOR)
  //   - data     : Informasi venue yang ingin dibuat
  // ----------------------------------------------------------
  async createVenue(
    userId: string,
    userRole: string,
    data: {
      name: string;
      description: string;
      city: string;
    }
  ) {
    // Rule 1: Hanya VENDOR yang bisa membuat venue
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can create a venue");
    }

    // Rule 2: Validasi field yang wajib diisi
    if (!data.name || !data.description || !data.city) {
      throw new Error("Name, description, and city are required");
    }

    // Rule 3: Cari VendorProfile milik user ini
    // VendorProfile dibuat otomatis saat register sebagai VENDOR
    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) {
      throw new Error("Vendor profile not found. Please contact support");
    }

    // Semua validasi lolos → buat venue baru
    const venue = await venueRepository.create({
      name: data.name,
      description: data.description,
      city: data.city,
      vendorId: vendorProfile.id, // pakai ID VendorProfile, bukan userId
    });

    return venue;
  },

  // ----------------------------------------------------------
  // getVendorVenues
  // Mengambil semua venue milik vendor yang sedang login.
  // Dipakai untuk halaman "My Venues" di dashboard vendor.
  // ----------------------------------------------------------
  async getVendorVenues(userId: string, userRole: string) {
    if (userRole !== "VENDOR") {
      throw new Error("Only vendors can view their venues");
    }

    const vendorProfile = await venueRepository.findVendorProfileByUserId(userId);
    if (!vendorProfile) {
      throw new Error("Vendor profile not found");
    }

    return venueRepository.findByVendorId(vendorProfile.id);
  },

  // ----------------------------------------------------------
  // getAllVenues
  // Mengambil semua venue yang tersedia (untuk halaman publik/pencarian).
  // Tidak butuh autentikasi — siapapun bisa lihat daftar venue.
  // ----------------------------------------------------------
  async getAllVenues() {
    return venueRepository.findAll();
  },
};