import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/user.repository";
import { profileService } from "@/lib/services/profile.service";

// GET /api/profile
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const profile = await userRepository.findById(user.userId);
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH /api/profile
export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

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