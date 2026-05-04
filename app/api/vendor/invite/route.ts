// ============================================================
// app/api/vendor/invite/route.ts
// ------------------------------------------------------------
// Vendor invite endpoints:
//   POST /api/vendor/invite
//     Headers: Authorization: Bearer <token>
//     Body: { email: string, ownerPassword: string }
//     Response: { success: true, message: string }
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import bcrypt from "bcrypt";
import { notificationRepository } from "@/lib/repositories/notification.repository";

export async function POST(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, ownerPassword } = body;

    if (!email || !ownerPassword) {
      return NextResponse.json(
        { error: "Email dan password owner diperlukan" },
        { status: 400 },
      );
    }

    // Get current user with password
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, password: true, name: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Verify owner password
    const isPasswordValid = await bcrypt.compare(
      ownerPassword,
      currentUser.password,
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password owner salah" },
        { status: 401 },
      );
    }

    // Get vendor membership for current user (must be OWNER)
    const membership = await prisma.vendorMember.findFirst({
      where: { userId: auth.userId, role: "OWNER" },
      include: { vendor: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Hanya owner yang dapat mengundang pengguna" },
        { status: 403 },
      );
    }

    // Check if user with email exists
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Pengguna dengan email tersebut tidak ditemukan" },
        { status: 404 },
      );
    }

    // Check if user is already a member of this vendor
    const existingMembership = await prisma.vendorMember.findFirst({
      where: { userId: targetUser.id, vendorId: membership.vendorId },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Pengguna sudah menjadi anggota vendor ini" },
        { status: 400 },
      );
    }

    const existingInvite = await prisma.notification.findFirst({
      where: {
        userId: targetUser.id,
        type: "VENDOR_INVITE",
        data: {
          string_contains: membership.vendorId,
        },
        isRead: false,
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Undangan sudah dikirim sebelumnya" },
        { status: 400 },
      );
    }

    // Create vendor membership with STAFF role
    await prisma.vendorMember.create({
      data: {
        userId: targetUser.id,
        vendorId: membership.vendorId,
        role: "STAFF",
      },
    });

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: "VENDOR" },
    });

    // Send notification to the invited user
    await notificationRepository.create({
      userId: targetUser.id,
      type: "VENDOR_INVITE",
      target: "USER",
      title: "🎉 Undangan Bergabung Vendor",
      message: `${currentUser.name} mengundang Anda untuk bergabung sebagai staff di vendor "${membership.vendor.name}". Klik untuk bergabung ke dashboard vendor.`,
      data: {
        vendorId: membership.vendorId,
        vendorName: membership.vendor.name,
        inviterName: currentUser.name,
        actionUrl: "/vendor",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Undangan berhasil dikirim ke ${targetUser.email}`,
    });
  } catch (error: any) {
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
