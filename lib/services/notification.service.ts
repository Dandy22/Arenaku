// ============================================================
// lib/services/notification.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic: Notification Service
// Contains all trigger handlers for notifications
// ============================================================

import { prisma } from "@/lib/prisma";
import { notificationRepository } from "@/lib/repositories/notification.repository";
// 🔥 IMPORT EMAIL SERVICE KAMU DI SINI
import { sendBookingInvoice } from "@/lib/mail";

// Helper: Get all admin user IDs
async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  return admins.map((a: any) => a.id);
}

// Helper: Get vendor members by venue/field
async function getVendorMembersByFieldId(fieldId: string): Promise<string[]> {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
    include: { venue: { include: { vendor: { include: { members: true } } } } },
  });

  if (!field?.venue?.vendor) return [];

  return field.venue.vendor.members.map((m: any) => m.userId);
}

// Helper: Get vendor members by event
async function getVendorMembersByEventId(eventId: string): Promise<string[]> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: {
        include: { vendorMemberships: { include: { vendor: true } } },
      },
    },
  });

  if (!event?.creator?.vendorMemberships) return [];

  // Get all members of the vendor
  const vendorId = event.creator.vendorMemberships[0]?.vendorId;
  if (!vendorId) return [];

  const members = await prisma.vendorMember.findMany({
    where: { vendorId },
    select: { userId: true },
  });

  return members.map((m: any) => m.userId);
}

// Helper: Get vendor owner ID by vendorId
async function getVendorOwnerId(vendorId: string): Promise<string | null> {
  const member = await prisma.vendorMember.findFirst({
    where: { vendorId, role: "OWNER" },
    select: { userId: true },
  });
  return member?.userId || null;
}

// ============================================================
// TRIGGER: Booking / Pesanan Baru (PENDING)
// ============================================================
export async function notifyBookingNew(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          field: { include: { venue: { include: { vendor: true } } } },
        },
      },
      user: true,
    },
  });

  if (!order) return;

  // Get unique vendor IDs from order items
  const vendorIds = new Set<string>();
  for (const item of order.items) {
    if (item.field?.venue?.vendor) {
      vendorIds.add(item.field.venue.vendor.id);
    }
  }

  // Notify each vendor
  for (const vendorId of vendorIds) {
    const members = await prisma.vendorMember.findMany({
      where: { vendorId },
      select: { userId: true },
    });

    for (const member of members) {
      await notificationRepository.create({
        userId: member.userId,
        type: "BOOKING_NEW",
        target: "VENDOR",
        title: "Booking Baru!",
        message: `${order.user?.name || "Someone"} baru saja memesan lapangan. Menunggu pembayaran.`,
        data: { orderId, vendorId },
      });
    }
  }

  // Also notify admins
  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await notificationRepository.create({
      userId: adminId,
      type: "BOOKING_NEW",
      target: "ADMIN",
      title: "Booking Baru",
      message: `Order baru dari ${order.user?.name || "Unknown"} dengan total Rp ${order.totalAmount.toLocaleString("id-ID")}`,
      data: { orderId },
    });
  }
}

// ============================================================
// TRIGGER: Pembayaran Berhasil (PAID)
// ============================================================
export async function notifyPaymentSuccess(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          field: { include: { venue: { include: { vendor: true } } } },
        },
      },
      // 🔥 Pastikan ini di-include agar data tiket event masuk ke Email Invoice
      eventTickets: {
        include: { event: true },
      },
      user: true,
      payment: true,
    },
  });

  if (!order) return;

  // Notify vendors
  const vendorIds = new Set<string>();
  for (const item of order.items) {
    if (item.field?.venue?.vendor) {
      vendorIds.add(item.field.venue.vendor.id);
    }
  }

  for (const vendorId of vendorIds) {
    const members = await prisma.vendorMember.findMany({
      where: { vendorId },
      select: { userId: true },
    });

    for (const member of members) {
      await notificationRepository.create({
        userId: member.userId,
        type: "PAYMENT_SUCCESS",
        target: "VENDOR",
        title: "Pembayaran Berhasil!",
        message: `Order #${orderId.slice(-6).toUpperCase()} sudah lunas.`,
        data: { orderId, vendorId },
      });
    }
  }

  // Notify customer
  if (order.userId) {
    await notificationRepository.create({
      userId: order.userId,
      type: "PAYMENT_SUCCESS",
      target: "USER",
      title: "Pembayaran Berhasil!",
      message: `Pembayaran untuk order #${orderId.slice(-6).toUpperCase()} telah berhasil.`,
      data: { orderId },
    });

    // 🔥 LOGIC BARU: KIRIM EMAIL INVOICE KE CUSTOMER SAAT LUNAS
    if (order.customerEmail) {
      try {
        await sendBookingInvoice(order.customerEmail, order);
      } catch (err) {
        console.error("Gagal kirim email invoice:", err);
      }
    }
  }
}

// ============================================================
// TRIGGER: Pembayaran Gagal (FAILED)
// ============================================================
export async function notifyPaymentFailed(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, payment: true },
  });

  if (!order) return;

  // Notify admins
  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await notificationRepository.create({
      userId: adminId,
      type: "PAYMENT_FAILED",
      target: "ADMIN",
      title: "Pembayaran Gagal",
      message: `Order #${orderId.slice(-6).toUpperCase()} atas nama ${order.user?.name || "Unknown"} mengalami kegagalan pembayaran.`,
      data: { orderId },
    });
  }
}

// ============================================================
// TRIGGER: Pesanan Dibatalkan/Expired
// ============================================================
export async function notifyOrderCancelled(orderId: string, reason?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          field: { include: { venue: { include: { vendor: true } } } },
        },
      },
      user: true,
    },
  });

  if (!order) return;

  const vendorIds = new Set<string>();
  for (const item of order.items) {
    if (item.field?.venue?.vendor) {
      vendorIds.add(item.field.venue.vendor.id);
    }
  }

  for (const vendorId of vendorIds) {
    const members = await prisma.vendorMember.findMany({
      where: { vendorId },
      select: { userId: true },
    });

    for (const member of members) {
      await notificationRepository.create({
        userId: member.userId,
        type: "ORDER_CANCELLED",
        target: "VENDOR",
        title: "Booking Dibatalkan",
        message: `Order #${orderId.slice(-6).toUpperCase()} oleh ${order.user?.name || "Customer"} telah dibatalkan${reason ? `: ${reason}` : "."}`,
        data: { orderId, vendorId },
      });
    }
  }
}

// ============================================================
// TRIGGER: Ulasan/Rating Baru
// ============================================================
export async function notifyRatingNew(venueId: string) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: { vendor: true },
  });

  if (!venue?.vendor) return;

  const rating = await prisma.venueRating.findFirst({
    where: { venueId },
    orderBy: { createdAt: "desc" },
  });

  const members = await prisma.vendorMember.findMany({
    where: { vendorId: venue.vendor.id },
    select: { userId: true },
  });

  for (const member of members) {
    await notificationRepository.create({
      userId: member.userId,
      type: "RATING_NEW",
      target: "VENDOR",
      title: "Rating Baru!",
      message: `Seseorang memberikan bintang ${rating?.rating || 5} untuk venue ${venue.name}.`,
      data: { venueId },
    });
  }
}

// ============================================================
// TRIGGER: Status Verifikasi Vendor
// ============================================================
export async function notifyVendorStatusChange(
  vendorId: string,
  newStatus: string,
) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) return;

  const owner = await prisma.vendorMember.findFirst({
    where: { vendorId, role: "OWNER" },
    include: { user: true },
  });

  if (!owner) return;

  if (newStatus === "VERIFIED") {
    await notificationRepository.create({
      userId: owner.userId,
      type: "VENDOR_VERIFIED",
      target: "VENDOR",
      title: "Verifikasi Berhasil!",
      message: `Selamat! Vendor ${vendor.name} sudah diverifikasi oleh Admin dan sekarang sudah live.`,
      data: { vendorId },
    });
  } else if (newStatus === "REJECTED") {
    await notificationRepository.create({
      userId: owner.userId,
      type: "VENDOR_VERIFIED",
      target: "VENDOR",
      title: "Verifikasi Ditolak",
      message: `Mohon maaf, vendor ${vendor.name} belum memenuhi persyaratan. Silakan hubungi admin untuk info lebih lanjut.`,
      data: { vendorId },
    });
  }
}

// ============================================================
// TRIGGER: Tiket Event Terjual
// ============================================================
export async function notifyTicketSold(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { creator: true },
  });

  if (!event?.creator) return;

  const members = await prisma.vendorMember.findMany({
    where: { userId: event.creatorId },
    select: { userId: true },
  });

  const ticketCount = await prisma.eventTicket.count({
    where: { eventId, status: "CONFIRMED" },
  });

  for (const member of members) {
    await notificationRepository.create({
      userId: member.userId,
      type: "TICKET_SOLD",
      target: "VENDOR",
      title: "Tiket Terjual!",
      message: `${ticketCount} Tiket untuk event "${event.title}" berhasil dibeli.`,
      data: { eventId },
    });
  }
}

// ============================================================
// TRIGGER: Pendaftaran Vendor Baru (untuk Admin)
// ============================================================
export async function notifyVendorRegister(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      members: { where: { role: "OWNER" }, include: { user: true } },
    },
  });

  if (!vendor) return;

  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await notificationRepository.create({
      userId: adminId,
      type: "VENDOR_REGISTER",
      target: "ADMIN",
      title: "Vendor Baru!",
      message: `${vendor.name} baru saja mendaftar. Segera periksa dan verifikasi.`,
      data: { vendorId },
    });
  }
}

// ============================================================
// TRIGGER: Event Baru Dibuat (untuk Admin)
// ============================================================
export async function notifyEventNew(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { creator: true },
  });

  if (!event) return;

  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await notificationRepository.create({
      userId: adminId,
      type: "EVENT_NEW",
      target: "ADMIN",
      title: "Event Baru",
      message: `Vendor ${event.creator?.name || "Unknown"} baru saja mempublikasikan event "${event.title}".`,
      data: { eventId },
    });
  }
}

// ============================================================
// TRIGGER: Pengguna Disuspend (untuk Admin)
// ============================================================
export async function notifyUserSuspended(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await notificationRepository.create({
      userId: adminId,
      type: "USER_SUSPENDED",
      target: "ADMIN",
      title: "Pengguna Disuspend",
      message: `Pengguna ${user.name} (${user.email}) telah disuspend.`,
      data: { userId },
    });
  }
}

// ============================================================
// TRIGGER: Refund Request
// ============================================================
export async function notifyRefundRequest(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return;

  const adminIds = await getAdminUserIds();

  for (const adminId of adminIds) {
    await notificationRepository.create({
      userId: adminId,
      type: "ORDER_CANCELLED", // Reuse type or add new if you updated enum
      target: "ADMIN",
      title: "Permintaan Refund",
      message: `User ${order.user.name} meminta refund untuk order #${orderId.slice(-6).toUpperCase()}`,
      data: { orderId },
    });
  }
}

// ============================================================
// TRIGGER: Hasil Proses Refund dari Admin
// ============================================================
export async function notifyRefundResult(
  orderId: string,
  status: "ACCEPT" | "REJECT",
  adminNote: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order || !order.userId) return;

  const isAccepted = status === "ACCEPT";

  await notificationRepository.create({
    userId: order.userId,
    type: "ORDER_CANCELLED", // Atau buat tipe baru REFUND_RESULT jika sudah ada di enum
    target: "USER",
    title: isAccepted ? "Refund Diterima" : "Refund Ditolak",
    message: isAccepted
      ? `Pengajuan refund order #${orderId.slice(-6).toUpperCase()} disetujui. Catatan: ${adminNote}`
      : `Pengajuan refund order #${orderId.slice(-6).toUpperCase()} ditolak. Pesanan Anda tetap Lunas. Catatan: ${adminNote}`,
    data: { orderId },
  });
}

export const notificationService = {
  notifyBookingNew,
  notifyPaymentSuccess,
  notifyPaymentFailed,
  notifyOrderCancelled,
  notifyRatingNew,
  notifyVendorStatusChange,
  notifyTicketSold,
  notifyVendorRegister,
  notifyEventNew,
  notifyUserSuspended,
  notifyRefundRequest,
  notifyRefundResult,
};
