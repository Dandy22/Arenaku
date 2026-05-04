// ============================================================
// app/api/vendor/profile/bank/route.ts
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

// PUT: Update vendor bank details
export async function PUT(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankName, bankAccountNumber, bankAccountName } = body;

    const vendorMember = await prisma.vendorMember.findFirst({
      where: { userId: auth.userId },
      include: { vendor: true },
    });

    if (!vendorMember) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check if user is OWNER
    if (vendorMember.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owner can update bank details" },
        { status: 403 },
      );
    }

    // Update vendor bank details
    const updated = await prisma.vendor.update({
      where: { id: vendorMember.vendorId },
      data: {
        ...(bankName && { bankName }),
        ...(bankAccountNumber && { bankAccountNumber }),
        ...(bankAccountName && { bankAccountName }),
        ...(vendorMember.vendor.status === "VERIFIED" &&
          (bankName || bankAccountNumber || bankAccountName) && {
            status: "PENDING",
          }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ vendor: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
