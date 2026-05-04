// ============================================================
// app/api/vendor/members/route.ts
// ------------------------------------------------------------
// Vendor members endpoints:
//   GET /api/vendor/members
//     Headers: Authorization: Bearer <token>
//     Response: { members: [...] }
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

// GET: Fetch all members of the vendor
export async function GET(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get vendor membership for current user
    const currentMember = await prisma.vendorMember.findFirst({
      where: { userId: auth.userId },
    });

    if (!currentMember) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Get all members of this vendor
    const members = await prisma.vendorMember.findMany({
      where: { vendorId: currentMember.vendorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({ members }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
