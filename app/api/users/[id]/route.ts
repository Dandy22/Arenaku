import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN")
      return NextResponse.json(
        { error: "Access denied. Admin only" },
        { status: 403 },
      );
    if (user.userId === id)
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    if (error.message.includes("token"))
      return NextResponse.json({ error: error.message }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN")
      return NextResponse.json(
        { error: "Access denied. Admin only" },
        { status: 403 },
      );
    if (user.userId === id)
      return NextResponse.json(
        { error: "Cannot suspend your own account" },
        { status: 400 },
      );

    const body = await req.json();
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id },
      data: { isSuspended: body.isSuspended },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message.includes("token"))
      return NextResponse.json({ error: error.message }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
