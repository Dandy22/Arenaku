import { NextResponse } from "next/server";
import { getAuth, getUserFromToken } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/user.repository";
import { profileService } from "@/lib/services/profile.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/vendor/profile
export async function GET(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with vendor membership
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get vendor data if user is VENDOR
    let vendor = null;
    let vendorRole = null;

    if (user.role === "VENDOR") {
      const vendorMember = await prisma.vendorMember.findFirst({
        where: { userId: user.id },
        include: {
          vendor: {
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
          },
        },
      });

      if (vendorMember) {
        vendor = vendorMember.vendor;
        vendorRole = vendorMember.role;
      }
    }

    return NextResponse.json({ user, vendor, vendorRole }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/vendor/profile
export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    console.log("  PAYLOAD MASUK:", body);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await profileService.updateProfile(user.userId, {
      name: body.name,
      phone: body.phone,
      vendorName: body.vendorName,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    console.log(" DATA SETELAH UPDATE DB:", updated);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("  ERROR API ROUTE:", error.message);
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
