import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
// Vendor can create venue
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  const decoded = verifyToken(token!) as any;

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (decoded.role !== "VENDOR") {
    return NextResponse.json(
      { error: "Only vendor can create venue" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: decoded.userId },
  });

  const venue = await prisma.venue.create({
    data: {
      name: body.name,
      description: body.description,
      city: body.city,
      vendorId: vendorProfile!.id,
    },
  });

  return NextResponse.json(venue);
}
