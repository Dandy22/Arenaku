import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminService } from "@/lib/services/admin.service";

// GET /api/admin/orders — semua order (ADMIN only)
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const orders = await adminService.getAllOrders(user.role);
    return NextResponse.json(orders);
  } catch (error: any) {
    if (error.message.includes("token")) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error.message.includes("Only admins")) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}