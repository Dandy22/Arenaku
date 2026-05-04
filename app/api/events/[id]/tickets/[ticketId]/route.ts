import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

// Helper untuk validasi kepemilikan
async function validateOwnership(req: Request, eventId: string) {
  const user = await getUserFromToken(req);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!event) throw new Error("Event tidak ditemukan");
  if (event.creatorId !== user.userId && user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}

// 1. UPDATE TIKET (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> },
) {
  try {
    const { id, ticketId } = await params;
    await validateOwnership(req, id);
    const body = await req.json();

    const updatedTicket = await prisma.eventTicketTier.update({
      where: { id: ticketId },
      data: {
        name: body.name,
        stock: parseInt(body.stock),
        price: parseInt(body.price) || 0,
        description: body.description || "",
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "Unauthorized" ? 403 : 400 },
    );
  }
}

// 2. HAPUS TIKET (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> },
) {
  try {
    const { id, ticketId } = await params;
    await validateOwnership(req, id);

    await prisma.eventTicketTier.delete({
      where: { id: ticketId },
    });

    return NextResponse.json({ message: "Tiket berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
