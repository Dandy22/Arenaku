// ============================================================
// lib/repositories/admin.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Admin Repository
//
// Query khusus untuk kebutuhan admin:
// - Lihat dan verifikasi vendor
// - Monitor semua order dan payment
// ============================================================

import { prisma } from "@/lib/prisma";

export const adminRepository = {
  // ----------------------------------------------------------
  // findAllVendors
  // Ambil semua vendor beserta status verifikasinya.
  // Bisa difilter berdasarkan status (PENDING/VERIFIED/REJECTED).
  // ----------------------------------------------------------
  findAllVendors: (status?: "PENDING" | "VERIFIED" | "REJECTED") =>
    prisma.vendorProfile.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, createdAt: true },
        },
        venues: {
          include: { fields: true },
        },
      },
      orderBy: { user: { createdAt: "desc" } },
    }),

  // ----------------------------------------------------------
  // findVendorById
  // Ambil detail satu vendor berdasarkan ID VendorProfile.
  // ----------------------------------------------------------
  findVendorById: (id: string) =>
    prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        venues: {
          include: { fields: true },
        },
      },
    }),

  // ----------------------------------------------------------
  // updateVendorStatus
  // Approve atau reject vendor oleh admin.
  // ----------------------------------------------------------
  updateVendorStatus: (id: string, status: "VERIFIED" | "REJECTED") =>
    prisma.vendorProfile.update({
      where: { id },
      data: { status },
    }),

  // ----------------------------------------------------------
  // findAllOrders
  // Ambil semua order dari semua user (untuk monitoring admin).
  // ----------------------------------------------------------
  findAllOrders: () =>
    prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: { field: { include: { venue: true } } },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
};