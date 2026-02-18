import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);

    if (user.role !== "VENDOR") {
      return NextResponse.json(
        { error: "Only vendor can create field" },
        { status: 403 }
      );
    }
// Vendor can only create field for their own venue
    const body = await req.json();
    const { name, type, price, venueId } = body;

    const field = await prisma.field.create({
      data: {
        name,
        type,
        price,
        venueId
      }
    });

    return NextResponse.json(field);
  } catch (err) {
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 });
  }
}
