import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }, // id ini adalah ID dari VendorMember, bukan userId
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Cek apakah yang mau nge-kick ini adalah OWNER
    const currentMember = await prisma.vendorMember.findFirst({
      where: { userId: auth.userId },
      include: { vendor: true },
    });

    if (!currentMember || currentMember.role !== "OWNER") {
      return NextResponse.json(
        { error: "Hanya OWNER yang dapat menghapus staff" },
        { status: 403 },
      );
    }

    // 2. Cari data staff yang mau di-kick
    const memberToDelete = await prisma.vendorMember.findUnique({
      where: { id },
    });

    if (!memberToDelete) {
      return NextResponse.json(
        { error: "Member tidak ditemukan" },
        { status: 404 },
      );
    }

    // Mencegah OWNER menghapus dirinya sendiri
    if (memberToDelete.userId === auth.userId) {
      return NextResponse.json(
        { error: "Owner tidak dapat menghapus dirinya sendiri" },
        { status: 400 },
      );
    }

    // 3. HAPUS STAFF DARI VENDOR
    await prisma.vendorMember.delete({
      where: { id },
    });

    // 4. LOGIKA DOWNGRADE ROLE (Kunci Utama)
    // Cek apakah user yang baru saja di-kick MASIH menjadi member di vendor LAIN
    const remainingMemberships = await prisma.vendorMember.count({
      where: { userId: memberToDelete.userId },
    });

    // Jika dia sudah tidak punya vendor sama sekali, kembalikan rolenya jadi CUSTOMER
    if (remainingMemberships === 0) {
      await prisma.user.update({
        where: { id: memberToDelete.userId },
        data: { role: "CUSTOMER" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Staff berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
