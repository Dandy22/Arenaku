// ============================================================
// app/api/events/[id]/tickets/route.ts
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/events/[id]/tickets
// Fetch semua tiket untuk sebuah event
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    const tickets = await prisma.eventTicketTier.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create tiket baru untuk event
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromToken(req);
    const { id: eventId } = await params;
    const body = await req.json();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Cek event ada dan user adalah creator atau admin
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.creatorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to add tickets to this event" },
        { status: 403 },
      );
    }

    // Validasi required fields
    if (!body.name || body.stock <= 0) {
      return NextResponse.json(
        { error: "name and valid stock are required" },
        { status: 400 },
      );
    }

    const ticket = await prisma.eventTicketTier.create({
      data: {
        eventId,
        name: body.name,
        stock: body.stock,
        description: body.description || "",
        price: body.price || 0,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
