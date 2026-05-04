// ============================================================
// app/api/events/[id]/tickets/[ticketId]/route.ts
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/events/[id]/tickets/[ticketId]
// Update tiket event
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> },
) {
  try {
    const user = await getUserFromToken(req);
    const { id: eventId, ticketId } = await params;
    const body = await req.json();

    // Cek event ada
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Cek user authorized
    if (event.creatorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to update this ticket" },
        { status: 403 },
      );
    }

    // Cek tiket ada
    const ticket = await prisma.eventTicketTier.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Validasi
    if (body.stock !== undefined && body.stock <= 0) {
      return NextResponse.json(
        { error: "Stock must be greater than 0" },
        { status: 400 },
      );
    }

    const updatedTicket = await prisma.eventTicketTier.update({
      where: { id: ticketId },
      data: {
        name: body.name || ticket.name,
        stock: body.stock !== undefined ? body.stock : ticket.stock,
        description:
          body.description !== undefined
            ? body.description
            : ticket.description,
        price: body.price !== undefined ? body.price : ticket.price,
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/events/[id]/tickets/[ticketId]
// Delete tiket event
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> },
) {
  try {
    const user = await getUserFromToken(req);
    const { id: eventId, ticketId } = await params;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Cek event ada
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Cek user authorized
    if (event.creatorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to delete this ticket" },
        { status: 403 },
      );
    }

    // Cek tiket ada
    const ticket = await prisma.eventTicketTier.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await prisma.eventTicketTier.delete({
      where: { id: ticketId },
    });

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
