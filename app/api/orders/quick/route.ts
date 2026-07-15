import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { orderService } from "@/lib/services/order.service";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const items = body.items || [];
    if (!items.length)
      return NextResponse.json({ error: "No items" }, { status: 400 });

    const order = await orderService.createOrderFromSlots(
      user.userId,
      user.role,
      {
        customerName: body.customerName || user.name || "",
        customerPhone: body.customerPhone || user.phone || "",
        customerEmail: body.customerEmail || user.email || "",
        notes: body.notes || "",
        items: items.map((it: any) => ({
          fieldId: it.fieldId,
          date: new Date(it.date),
          startHour: it.startHour,
          endHour: it.endHour,
          price: it.price,
        })),
      },
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
