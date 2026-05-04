import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminService } from "@/lib/services/admin.service";

// GET /api/admin/users
// Query: ?role=ADMIN|VENDOR|CUSTOMER

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);

    const role = searchParams.get("role") as
      | "ADMIN"
      | "VENDOR"
      | "CUSTOMER"
      | null;

    const users = await adminService.getAllUsers(user.role, role ?? undefined);

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.message.includes("Only admins")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
