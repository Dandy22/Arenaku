import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

// GET: Ambil history penarikan vendor
export async function GET(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vendorMember = await prisma.vendorMember.findFirst({
      where: { userId: auth.userId },
    });

    if (!vendorMember) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { vendorId: vendorMember.vendorId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ withdrawals }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Buat request penarikan baru
export async function POST(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount < 10000) {
      return NextResponse.json(
        { error: "Minimal penarikan adalah Rp 10.000" },
        { status: 400 },
      );
    }

    const vendorMember = await prisma.vendorMember.findFirst({
      where: { userId: auth.userId },
      include: { vendor: true },
    });

    if (!vendorMember)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    // HANYA OWNER YANG BOLEH NARIK UANG (Keamanan Penting!)
    if (vendorMember.role !== "OWNER") {
      return NextResponse.json(
        { error: "Hanya Owner yang dapat menarik dana" },
        { status: 403 },
      );
    }

    const vendor = vendorMember.vendor;

    // Cek kelengkapan bank
    if (
      !vendor.bankName ||
      !vendor.bankAccountNumber ||
      !vendor.bankAccountName
    ) {
      return NextResponse.json(
        {
          error:
            "Mohon lengkapi data rekening bank di menu Profil terlebih dahulu.",
        },
        { status: 400 },
      );
    }

    // Cek saldo cukup
    if (vendor.balance < amount) {
      return NextResponse.json(
        { error: "Saldo tidak mencukupi" },
        { status: 400 },
      );
    }

    // 1. Buat record Withdrawal
    // 2. Kurangi Saldo (Gunakan Transaction agar aman!)
    const [withdrawal] = await prisma.$transaction([
      prisma.withdrawal.create({
        data: {
          vendorId: vendor.id,
          amount: amount,
          status: "PENDING",
          bankName: vendor.bankName,
          accountNumber: vendor.bankAccountNumber,
          accountName: vendor.bankAccountName,
        },
      }),
      prisma.vendor.update({
        where: { id: vendor.id },
        data: { balance: { decrement: amount } },
      }),
    ]);

    // TODO Opsional: Kirim notifikasi ke Admin kalau ada request withdrawal baru

    return NextResponse.json(
      {
        success: true,
        message: "Request penarikan berhasil diajukan",
        withdrawal,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
