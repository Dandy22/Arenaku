import { NextResponse } from "next/server";
import { paymentService } from "@/lib/services/payment.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId?: string; id?: string }> },
) {
  try {
    const resolvedParams = await params;
    const targetOrderId = resolvedParams.orderId || resolvedParams.id;

    if (!targetOrderId) {
      return NextResponse.json(
        { error: "Order ID is missing in URL" },
        { status: 400 },
      );
    }

    const result = await paymentService.confirmPayment(targetOrderId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ ERROR CONFIRM:", error.message);
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
