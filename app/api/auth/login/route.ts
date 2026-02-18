import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Route handler for user login
export async function POST(req: Request) {
  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const isValid = await bcrypt.compare(body.password, user.password);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    "SECRET_KEY",
    { expiresIn: "7d" }
  );

  return NextResponse.json({ token });
}
