import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminService } from "@/lib/services/admin.service";

// GET /api/admin/vendors
// Query:
// ?status=PENDING|VERIFIED|REJECTED
// ?search=nama vendor

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") as
      | "PENDING"
      | "VERIFIED"
      | "REJECTED"
      | null;

    const search = searchParams.get("search") || undefined;

    const vendors = await adminService.getAllVendors(
      user.role,
      status ?? undefined,
      search,
    );

    return NextResponse.json(vendors);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.message.includes("Only admins")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 },
    );
  }
}
