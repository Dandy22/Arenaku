// ============================================================
// lib/repositories/admin.repository.ts
// ============================================================

import { prisma } from "@/lib/prisma";

export const adminRepository = {
  // ----------------------------------------------------------
  // findAllVendors
  // Sekarang mengambil data dari model Vendor (Organisasi)
  // ----------------------------------------------------------
  findAllVendors: (
    status?: "PENDING" | "VERIFIED" | "REJECTED",
    search?: string,
  ) =>
    prisma.vendor.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {}),
      },
      include: {
        // Mengambil siapa saja member/owner-nya
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true, // <--- FIX: Tambahkan ini agar masuk ke tabel
                district: true, // <--- FIX: Tambahkan ini agar masuk ke tabel
              },
            },
          },
        },
        venues: {
          include: {
            fields: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

  // ----------------------------------------------------------
  // findVendorById
  // Mencari berdasarkan ID Organisasi Vendor
  // ----------------------------------------------------------
  findVendorById: (id: string) =>
    prisma.vendor.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                district: true,
              },
            },
          },
        },
        venues: {
          include: { fields: true },
        },
      },
    }),

  // ----------------------------------------------------------
  // updateVendorStatus
  // ----------------------------------------------------------
  updateVendorStatus: (id: string, status: "VERIFIED" | "REJECTED") =>
    prisma.vendor.update({
      where: { id },
      data: { status },
    }),

  // ----------------------------------------------------------
  // findAllOrders
  // Tetap sama, tapi pastikan relasi item mengarah ke vendor organisasi
  // ----------------------------------------------------------
  findAllOrders: () =>
    prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            field: {
              include: {
                venue: {
                  include: { vendor: true },
                },
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),

  // ----------------------------------------------------------
  // findAllUsers
  // Ambil semua user dengan filter role
  // ----------------------------------------------------------
  findAllUsers: (role?: "ADMIN" | "VENDOR" | "CUSTOMER") =>
    prisma.user.findMany({
      where: role ? { role } : {},
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        district: true,
        isSuspended: true,
        isEmailVerified: true,
        createdAt: true,
        vendorMemberships: {
          include: {
            vendor: {
              select: {
                name: true,
                venues: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

  // ----------------------------------------------------------
  // updateUserSuspension
  // Update status suspend user
  // ----------------------------------------------------------
  updateUserSuspension: (id: string, isSuspended: boolean) =>
    prisma.user.update({
      where: { id },
      data: { isSuspended },
      select: {
        id: true,
        name: true,
        email: true,
        isSuspended: true,
      },
    }),

  // ----------------------------------------------------------
  // deleteUser
  // Hapus user
  // ----------------------------------------------------------
  deleteUser: (id: string) =>
    prisma.user.delete({
      where: { id },
    }),

  // ----------------------------------------------------------
  // deleteVendor
  // Menggunakan Cascade Delete yang sudah ada di Schema
  // ----------------------------------------------------------
  deleteVendor: (id: string) =>
    prisma.$transaction(async (tx) => {
      // 1. Ambil semua userId yang tergabung di vendor ini
      const members = await tx.vendorMember.findMany({
        where: { vendorId: id },
        select: { userId: true },
      });

      // 2. Hapus Organisasi Vendor
      // Karena di schema pakai onDelete: Cascade, maka:
      // Venue, Field, VendorMember otomatis TERHAPUS
      await tx.vendor.delete({ where: { id } });

      // 3. Hapus User terkait jika mereka hanya berperan sebagai Vendor
      const userIds = members.map((m) => m.userId);
      await tx.user.deleteMany({
        where: {
          id: { in: userIds },
          role: "VENDOR",
        },
      });
    }),
};
