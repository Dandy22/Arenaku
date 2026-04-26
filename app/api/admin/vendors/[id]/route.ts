import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminService } from "@/lib/services/admin.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    const body = await req.json();

    if (!["VERIFIED", "REJECTED"].includes(body.status)) {
      return NextResponse.json({ error: "Status must be VERIFIED or REJECTED" }, { status: 400 });
    }

    const vendor = await adminService.updateVendorStatus(user.role, id, body.status);
    return NextResponse.json(vendor);
  } catch (error: any) {
    if (error.message.includes("token")) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error.message.includes("Only admins")) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.message.includes("not found")) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}