import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminService } from "@/lib/services/admin.service";

// PATCH /api/admin/users/[id]
// Body: { isSuspended: boolean }

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isSuspended } = body;

    if (typeof isSuspended !== "boolean") {
      return NextResponse.json(
        { error: "isSuspended must be a boolean" },
        { status: 400 },
      );
    }

    const updated = await adminService.updateUserSuspension(
      user.role,
      id,
      isSuspended,
    );
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message.includes("token"))
      return NextResponse.json({ error: error.message }, { status: 401 });
    if (error.message.includes("Only admins"))
      return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.message.includes("not found"))
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/admin/users/[id]

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminService.deleteUser(user.role, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message.includes("token"))
      return NextResponse.json({ error: error.message }, { status: 401 });
    if (error.message.includes("Only admins"))
      return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.message.includes("not found"))
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
