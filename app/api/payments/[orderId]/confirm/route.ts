import { NextResponse } from "next/server";
import { paymentService } from "@/lib/services/payment.service";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const result = await paymentService.confirmPayment(payment.id);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message.includes("not found")) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}