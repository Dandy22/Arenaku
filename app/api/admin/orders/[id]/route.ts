import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { orderService } from "@/lib/services/order.service";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);

    // Pastikan hanya ADMIN yang bisa akses endpoint ini
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 🔥 Tangkap data yang dikirim dari Frontend
    const { action, refundStatus, adminNote } = body;

    // 🔥 LOGIC BARU: Proses Refund (Terima / Tolak)
    if (action === "process-refund") {
      const order = await orderService.processRefundDecision(
        id,
        refundStatus,
        adminNote,
      );
      return NextResponse.json(order);
    }

    // (Ini logic bawaan kamu sebelumnya, biarkan saja)
    if (action === "refund-complete") {
      const order = await orderService.refundComplete(user.userId, id);
      return NextResponse.json(order);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
