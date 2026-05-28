// ============================================================
// lib/repositories/field.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Field (Lapangan) Repository
//
// Operasi database untuk tabel "Field".
// Field adalah lapangan olahraga di dalam sebuah Venue.
// ============================================================
import { prisma } from "@/lib/prisma";

export const fieldRepository = {
  create: (data: {
    name: string;
    type: string;
    floorType: string;
    length: number;
    width: number;
    price: number;
    description: string;
    venueId: string;
    thumbnailUrl?: string;
    // ✅ Tambahkan images di sini
    images?: { url: string; title: string }[];
  }) =>
    prisma.field.create({
      data: {
        name: data.name,
        type: data.type,
        floorType: data.floorType,
        length: data.length,
        width: data.width,
        price: data.price,
        description: data.description,
        venueId: data.venueId,
        thumbnailUrl: data.thumbnailUrl,
        // ✅ Buat relasi gambar sekaligus saat lapangan dibuat
        images: {
          create:
            data.images?.map((img) => ({
              url: img.url,
              title: img.title || "Detail Lapangan",
            })) || [],
        },
      },
      include: { images: true, contacts: true },
    }),

  update: (
    id: string,
    data: {
      name?: string;
      type?: string;
      floorType?: string;
      length?: number;
      width?: number;
      price?: number;
      description?: string;
      thumbnailUrl?: string;
      // ✅ Tambahkan images di sini
      images?: { url: string; title: string }[];
    },
  ) =>
    prisma.field.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        floorType: data.floorType,
        length: data.length,
        width: data.width,
        price: data.price,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        // ✅ Hapus gambar lama, ganti dengan gambar baru dari form
        ...(data.images && {
          images: {
            deleteMany: {},
            create: data.images.map((img) => ({
              url: img.url,
              title: img.title || "Detail Lapangan",
            })),
          },
        }),
      },
      include: { images: true, contacts: true },
    }),

  deleteById: (id: string) =>
    prisma.field.delete({
      where: { id },
    }),

  findById: (id: string) =>
    prisma.field.findUnique({
      where: { id },
      include: {
        venue: true,
        images: true,
        contacts: true,
      },
    }),

  findByVenueId: (venueId: string) =>
    prisma.field.findMany({
      where: { venueId },
      include: {
        images: true,
        contacts: true,
      },
      orderBy: { name: "asc" },
    }),

  // Images
  addImage: (fieldId: string, url: string, title: string) =>
    prisma.fieldImage.create({
      data: {
        fieldId,
        url,
        title, // ✅ Pastikan title masuk di sini
      },
    }),

  deleteImage: (imageId: string) =>
    prisma.fieldImage.delete({
      where: { id: imageId },
    }),

  // Contacts
  addContact: (
    fieldId: string,
    data: {
      name: string;
      email?: string;
      phone?: string;
    },
  ) =>
    prisma.fieldContact.create({
      data: {
        fieldId,
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
      },
    }),

  updateContact: (
    contactId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
    },
  ) =>
    prisma.fieldContact.update({
      where: { id: contactId },
      data,
    }),

  deleteContact: (contactId: string) =>
    prisma.fieldContact.delete({
      where: { id: contactId },
    }),

  findContact: (contactId: string) =>
    prisma.fieldContact.findUnique({
      where: { id: contactId },
      include: { field: true },
    }),
};
