// ============================================================
// app/api/orders/cleanup/route.ts
// ------------------------------------------------------------
// Endpoint untuk membersihkan order pending yang sudah kedaluwarsa
// Dipanggil oleh cron job setiap menit untuk cek order yang > 24 jam
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification.service";

export async function POST(req: Request) {
  try {
    // Cari semua order PENDING yang sudah expired (> 24 jam)
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: new Date(), // Sudah lewat dari waktu expired
        },
      },
      include: {
        user: true,
        items: {
          include: {
            field: {
              include: {
                venue: {
                  include: {
                    vendor: true,
                  },
                },
              },
            },
          },
        },
        eventTickets: {
          include: {
            event: true,
          },
        },
        payment: true,
      },
    });

    if (expiredOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired orders found",
        cleaned: 0,
      });
    }

    // Cancel each expired order
    let cleaned = 0;
    for (const order of expiredOrders) {
      // Update order status to CANCELLED
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      // Update payment status if exists
      if (order.payment) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: "EXPIRED" },
        });
      }

      // Update event tickets status if any
      if (order.eventTickets.length > 0) {
        await prisma.eventTicket.updateMany({
          where: {
            id: { in: order.eventTickets.map((t: { id: string }) => t.id) },
          },
          data: { status: "CANCELLED" },
        });
      }

      // Kirim notifikasi ke user
      try {
        await notificationService.notifyOrderCancelled(
          order.id,
          "Pembayaran kedaluwarsa (24 jam)",
        );
      } catch (notifErr) {
        console.error("[Cleanup] Gagal mengirim notifikasi:", notifErr);
      }

      cleaned++;
      console.log(`[Cleanup] Cancelled expired order: ${order.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned ${cleaned} expired orders`,
      cleaned,
    });
  } catch (error: any) {
    console.error("[Cleanup] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET untuk testing
export async function GET() {
  // Hitung jumlah order pending yang sudah expired
  const expiredCount = await prisma.order.count({
    where: {
      status: "PENDING",
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  const pendingCount = await prisma.order.count({
    where: { status: "PENDING" },
  });

  return NextResponse.json({
    status: "ok",
    expiredOrders: expiredCount,
    pendingOrders: pendingCount,
    message: "Order cleanup endpoint is active",
  });
}
