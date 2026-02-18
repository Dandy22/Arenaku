import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token) as any;

  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  return NextResponse.json(user);
}
