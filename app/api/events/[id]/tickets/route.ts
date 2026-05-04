import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const tickets = await prisma.eventTicketTier.findMany({
      where: { eventId: id },
      orderBy: { price: "asc" },
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    const body = await req.json();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Validasi: Hanya pemilik event (Vendor) yang bisa nambah tiket
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 },
      );
    }

    if (event.creatorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // app/api/events/[id]/tickets/route.ts

    const ticketTier = await prisma.eventTicketTier.create({
      data: {
        eventId: id,
        name: body.name,
        // category: body.category || "REGULER", <-- HAPUS
        stock: parseInt(body.stock),
        price: parseInt(body.price) || 0,
        description: body.description || "",
      },
    });

    return NextResponse.json(ticketTier, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
