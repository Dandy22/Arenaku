// ============================================================
// lib/services/payment.service.ts
// ------------------------------------------------------------
// TIER 2 — Business Logic Layer: Payment Service
//
// Payment dibuat setelah user pilih metode bayar.
// QR code di-generate di sini (simulasi — di production
// integrasikan dengan Midtrans / Xendit / payment gateway).
// ============================================================

import { paymentRepository } from "@/lib/repositories/payment.repository";
import { orderRepository } from "@/lib/repositories/order.repository";

// Durasi expired payment: 15 menit
const PAYMENT_EXPIRY_MINUTES = 15;

export const paymentService = {
  // ----------------------------------------------------------
  // createPayment
  // Buat payment untuk sebuah order.
  // Generate QR code dan set waktu expired.
  // ----------------------------------------------------------
  async createPayment(
    userId: string,
    data: {
      orderId: string;
      method: string; // "QRIS" | "BANK_TRANSFER" | "E_WALLET"
    }
  ) {
    // Validasi metode pembayaran yang tersedia
    const validMethods = ["QRIS", "BANK_TRANSFER", "E_WALLET"];
    if (!validMethods.includes(data.method)) {
      throw new Error(`Invalid payment method. Choose: ${validMethods.join(", ")}`);
    }

    // Ambil order dan pastikan milik user ini
    const order = await orderRepository.findById(data.orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) {
      throw new Error("You are not authorized to pay this order");
    }

    // Jika order sudah punya payment, jangan buat lagi
    if (order.payment) {
      throw new Error("Payment already exists for this order");
    }

    // Pastikan order masih PENDING (belum dibayar / dibatalkan)
    if (order.status !== "PENDING") {
      throw new Error(`Cannot create payment for order with status: ${order.status}`);
    }

    // Hitung waktu expired (sekarang + 15 menit)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + PAYMENT_EXPIRY_MINUTES);

    // Generate QR code (simulasi)
    // Di production: panggil API Midtrans/Xendit di sini
    const qrCode = generateQRCode(data.orderId, order.totalAmount, data.method);

    // Buat record payment
    const payment = await paymentRepository.create({
      orderId: data.orderId,
      amount: order.totalAmount,
      method: data.method,
      qrCode,
      expiredAt,
    });

    return payment;
  },

  // ----------------------------------------------------------
  // getPaymentStatus
  // Cek status payment berdasarkan orderId.
  // Frontend polling endpoint ini untuk cek apakah QR sudah di-scan.
  // ----------------------------------------------------------
  async getPaymentStatus(userId: string, orderId: string) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new Error("Payment not found");

    // Security: pastikan order milik user yang request
    if (payment.order.userId !== userId) {
      throw new Error("You are not authorized to view this payment");
    }

    // Cek apakah payment sudah expired
    if (payment.status === "PENDING" && new Date() > payment.expiredAt) {
      // Auto-update ke EXPIRED jika sudah lewat waktu
      await paymentRepository.updateStatus(payment.id, "EXPIRED");
      await orderRepository.updateStatus(orderId, "CANCELLED");
      return { ...payment, status: "EXPIRED" };
    }

    return payment;
  },

  // ----------------------------------------------------------
  // confirmPayment (simulasi)
  // Di production ini dipanggil oleh webhook dari payment gateway.
  // Di sini kita buat endpoint manual untuk simulasi.
  // ----------------------------------------------------------
  async confirmPayment(paymentId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw new Error("Payment not found");

    if (payment.status !== "PENDING") {
      throw new Error(`Payment already ${payment.status}`);
    }

    // Update payment ke SUCCESS
    await paymentRepository.updateStatus(paymentId, "SUCCESS");

    // Update order ke PAID
    await orderRepository.updateStatus(payment.orderId, "PAID");

    return { message: "Payment confirmed successfully" };
  },
};

// ----------------------------------------------------------
// generateQRCode (helper)
// Simulasi generate QR code string.
// Di production: panggil Midtrans QRIS API atau Xendit.
// ----------------------------------------------------------
function generateQRCode(orderId: string, amount: number, method: string): string {
  if (method === "QRIS") {
    // Format simulasi QRIS — di production diganti response dari payment gateway
    return `QRIS-${orderId}-${amount}-${Date.now()}`;
  }
  // Untuk metode lain, return info rekening/instruksi
  return `${method}-${orderId}-${amount}`;
}