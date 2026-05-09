import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.JWT_SECRET || "SECRET_KEY_DEV_ONLY";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verified=0", req.url));
  }

  let decoded: any;

  try {
    decoded = jwt.verify(token, SECRET);
  } catch (error) {
    return NextResponse.redirect(new URL("/login?verified=0", req.url));
  }

  if (!decoded?.userId || decoded?.type !== "email_verification") {
    return NextResponse.redirect(new URL("/login?verified=0", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login?verified=0", req.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true },
  });

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
