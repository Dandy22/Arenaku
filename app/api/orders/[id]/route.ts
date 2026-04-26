import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { orderService } from "@/lib/services/order.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    const order = await orderService.getOrderById(user.userId, id);
    return NextResponse.json(order);
  } catch (error: any) {
    if (error.message.includes("token")) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error.message.includes("not authorized")) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.message.includes("not found")) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}