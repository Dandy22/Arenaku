import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { paymentService } from "@/lib/services/payment.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payment = await paymentService.getPaymentStatus(user.userId, orderId);
    return NextResponse.json(payment);
  } catch (error: any) {
    if (error.message.includes("token"))
      return NextResponse.json({ error: error.message }, { status: 401 });
    if (error.message.includes("not authorized"))
      return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.message.includes("not found"))
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
