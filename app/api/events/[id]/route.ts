import { NextResponse } from "next/server";
import { eventService } from "@/lib/services/event.service";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const event = await eventService.getEventById(id);
    return NextResponse.json(event);
  } catch (error: any) {
    if (error.message.includes("not found"))
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { creatorId: true }, // Cukup ambil creatorId
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 },
      );
    }

    // --- LOGIC PERMISSION SIMPEL ---
    let authorized = false;

    if (user.role === "ADMIN") {
      authorized = true;
    } else if (event.creatorId === user.userId) {
      authorized = true;
    } else {
      // Cek apakah mereka satu vendor (Logika cari vendorId si user)
      const userVendor = await prisma.vendorMember.findFirst({
        where: { userId: user.userId },
        select: { vendorId: true },
      });

      const creatorVendor = await prisma.vendorMember.findFirst({
        where: { userId: event.creatorId },
        select: { vendorId: true },
      });

      if (
        userVendor &&
        creatorVendor &&
        userVendor.vendorId === creatorVendor.vendorId
      ) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Gak boleh hapus punya orang lain!" },
        { status: 403 },
      );
    }

    // Gunakan delete via repository
    await eventService.deleteEvent(id, user.userId, user.role);

    return NextResponse.json({ message: "Event berhasil dihapus" });
  } catch (error: any) {
    console.error("CRASH PAS DELETE:", error); // CEK TERMINAL LU, ERRORNYA MUNCUL DI SANA
    return NextResponse.json(
      { error: "Server Error: " + error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // --- FIX PERMISSION UNTUK STAFF ---
    const isSameVendor = await prisma.vendorMember.findFirst({
      where: {
        userId: user.userId,
        vendor: {
          members: { some: { userId: existingEvent.creatorId } },
        },
      },
    });

    if (
      user.role !== "ADMIN" &&
      existingEvent.creatorId !== user.userId &&
      !isSameVendor
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // UPDATE KESELURUHAN DATA
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        district: body.district,
        city: body.city,
        topic: body.topic,
        category: body.category,
        imageUrl: body.imageUrl,
        date: body.date ? new Date(body.date) : existingEvent.date,
        endDate: body.endDate ? new Date(body.endDate) : existingEvent.endDate,
        startHour: body.startHour,
        endHour: body.endHour,
        capacity: Number(body.capacity) || existingEvent.capacity,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        latitude: body.latitude,
        longitude: body.longitude,
        status: body.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
