// ============================================================
// lib/repositories/payment.repository.ts
// ------------------------------------------------------------
// TIER 3 — Data Access Layer: Payment Repository
//
// Payment dibuat setelah user konfirmasi order dan pilih
// metode pembayaran. QR code di-generate di service layer.
// ============================================================

import { prisma } from "@/lib/prisma";

export const paymentRepository = {
  // ----------------------------------------------------------
  // create
  // Buat record payment baru untuk sebuah order.
  // expiredAt diset 15 menit dari sekarang (bisa dikonfigurasi).
  // ----------------------------------------------------------
  create: (data: {
    orderId: string;
    amount: number;
    method: string;
    qrCode: string;
    expiredAt: Date;
  }) =>
    prisma.payment.create({ data }),

  // ----------------------------------------------------------
  // findByOrderId
  // Ambil payment berdasarkan orderId.
  // Dipakai untuk cek status dan tampilkan QR di frontend.
  // ----------------------------------------------------------
  findByOrderId: (orderId: string) =>
    prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    }),

  // ----------------------------------------------------------
  // findById
  // Ambil payment berdasarkan ID-nya langsung.
  // ----------------------------------------------------------
  findById: (id: string) =>
    prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    }),

  // ----------------------------------------------------------
  // updateStatus
  // Update status payment (SUCCESS / FAILED / EXPIRED).
  // Kalau SUCCESS → set paidAt ke waktu sekarang.
  // ----------------------------------------------------------
  updateStatus: (id: string, status: "SUCCESS" | "FAILED" | "EXPIRED") =>
    prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: status === "SUCCESS" ? new Date() : undefined,
      },
    }),
};