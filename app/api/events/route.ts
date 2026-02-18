import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        date: new Date(body.date),
        startHour: body.startHour,
        endHour: body.endHour,
        ticketPrice: body.ticketPrice,
        capacity: body.capacity,
        creatorId: user.userId,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
