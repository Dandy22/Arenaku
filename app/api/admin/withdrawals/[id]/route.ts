import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuth(req);
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, adminNote } = body;

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) {
      return NextResponse.json(
        { error: "Data penarikan tidak ditemukan" },
        { status: 404 },
      );
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Status penarikan sudah diproses sebelumnya" },
        { status: 400 },
      );
    }

    // Kalau ditolak, uangnya dikembalikan ke saldo vendor
    if (status === "REJECTED") {
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id },
          data: { status, adminNote },
        }),
        prisma.vendor.update({
          where: { id: withdrawal.vendorId },
          data: { balance: { increment: withdrawal.amount } },
        }),
      ]);
    } else {
      // Kalau sukses, cukup update statusnya saja
      await prisma.withdrawal.update({
        where: { id },
        data: { status, adminNote },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Status berhasil diubah menjadi ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
