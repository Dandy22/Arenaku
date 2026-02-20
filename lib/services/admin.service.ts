// ============================================================
// lib/services/admin.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic Layer: Admin Service
//
// Logika bisnis khusus admin:
//   - Verifikasi / reject vendor
//   - Monitor semua order
// ============================================================

import { adminRepository } from "@/lib/repositories/admin.repository";

export const adminService = {
  // ----------------------------------------------------------
  // getAllVendors
  // Ambil semua vendor, bisa difilter by status.
  // ----------------------------------------------------------
  async getAllVendors(
    userRole: string,
    status?: "PENDING" | "VERIFIED" | "REJECTED"
  ) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can view vendor list");
    }
    return adminRepository.findAllVendors(status);
  },

  // ----------------------------------------------------------
  // updateVendorStatus
  // Admin approve atau reject vendor.
  // Vendor yang VERIFIED bisa tambah venue & lapangan.
  // ----------------------------------------------------------
  async updateVendorStatus(
    userRole: string,
    vendorId: string,
    status: "VERIFIED" | "REJECTED"
  ) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can verify vendors");
    }

    const vendor = await adminRepository.findVendorById(vendorId);
    if (!vendor) throw new Error("Vendor not found");

    // Jangan proses yang sudah di-approve/reject dengan status sama
    if (vendor.status === status) {
      throw new Error(`Vendor is already ${status}`);
    }

    return adminRepository.updateVendorStatus(vendorId, status);
  },

  // ----------------------------------------------------------
  // getAllOrders
  // Monitor semua order di sistem (khusus admin).
  // ----------------------------------------------------------
  async getAllOrders(userRole: string) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can view all orders");
    }
    return adminRepository.findAllOrders();
  },
};