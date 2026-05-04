// ============================================================
// app/api/auth/reset-password/route.ts
// ------------------------------------------------------------
// Password reset endpoint:
//   POST /api/auth/reset-password
//     Body: { email: string }
//     Response: { message: "Reset link sent to email" }
//
//   PUT /api/auth/reset-password
//     Body: { token: string, newPassword: string }
//     Response: { message: "Password reset successful" }
// ============================================================

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.JWT_SECRET || "SECRET_KEY_DEV_ONLY";
const BCRYPT_SALT_ROUNDS = 10;

// POST: Request password reset
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that email doesn't exist
      return NextResponse.json(
        { message: "If the email exists, a reset link will be sent" },
        { status: 200 },
      );
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, type: "password_reset" },
      SECRET,
      { expiresIn: "1h" },
    );

    // Store reset token in database (you might want to add a ResetToken model)
    // For now, we'll return the token directly (in production, send via email)
    return NextResponse.json(
      {
        message: "If the email exists, a reset link will be sent",
        // DEV ONLY: Remove this in production
        devToken: resetToken,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Reset password with token
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    if (decoded.type !== "password_reset") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update user password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
