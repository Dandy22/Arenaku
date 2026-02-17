import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const venues = await prisma.venue.findMany({
    include: {
      fields: true,
    },
  });

  return NextResponse.json(venues);
}
