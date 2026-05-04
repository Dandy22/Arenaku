import { NextResponse } from "next/server";
import { getAuth, getUserFromToken } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/user.repository";
import { profileService } from "@/lib/services/profile.service";
import { prisma } from "@/lib/prisma"; // 👉 Wajib di-import untuk query database

// 👉 Matikan cache bawaan Next.js agar role selalu update!
export const dynamic = "force-dynamic";

// GET /api/vendor/profile
export async function GET(req: Request) {
  try {
    // Pastikan fungsi getAuth atau getUserFromToken sesuai dengan yang ada di auth.ts kamu
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
    let vendorRole = null; // 👈 1. Buat variabel untuk menampung role

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
        vendorRole = vendorMember.role; // 👈 2. Ambil rolenya (OWNER / STAFF)
      }
    }

    // 👈 3. Kirimkan vendorRole ke frontend
    return NextResponse.json({ user, vendor, vendorRole }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/vendor/profile
export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await profileService.updateProfile(user.userId, {
      name: body.name,
      phone: body.phone,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
