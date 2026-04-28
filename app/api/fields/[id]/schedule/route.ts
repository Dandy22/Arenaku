import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/fields/[id]/schedule?date=2026-02-11        → jadwal 1 hari
// GET /api/fields/[id]/schedule?startDate=2026-02-11   → jadwal 7 hari (mingguan)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const startDateStr = searchParams.get("startDate");

    if (!dateStr && !startDateStr) {
      return NextResponse.json(
        { error: "date or startDate query parameter is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Ambil data field untuk dapat harga
    const field = await prisma.field.findUnique({
      where: { id },
      select: { id: true, name: true, price: true },
    });

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Mode mingguan: startDate → 7 hari
    if (startDateStr) {
      const startDate = new Date(startDateStr);
      const days = [];

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const bookedSlots = await prisma.orderItem.findMany({
          where: {
            fieldId: id,
            date: currentDate,
            order: { status: "PAID" },
          },
          select: { startHour: true, endHour: true },
          orderBy: { startHour: "asc" },
        });

        const bookedHours = new Set<number>();
        for (const slot of bookedSlots) {
          for (let h = slot.startHour; h < slot.endHour; h++) {
            bookedHours.add(h);
          }
        }

        const slots = [];
        const now = new Date();
        for (let h = 8; h < 22; h++) {
          const isBooked = bookedHours.has(h);
          const isPast =
            currentDate.toDateString() === now.toDateString()
              ? h <= now.getHours()
              : currentDate < new Date(now.toDateString());

          slots.push({
            startHour: h,
            endHour: h + 1,
            label: `${String(h).padStart(2, "0")}:00 - ${String(h + 1).padStart(2, "0")}:00`,
            price: field.price,
            status: isPast ? "PAST" : isBooked ? "BOOKED" : "AVAILABLE",
          });
        }

        days.push({
          date: currentDate.toISOString().split("T")[0],
          dayName: currentDate.toLocaleDateString("id-ID", { weekday: "long" }),
          dayDate: currentDate.toLocaleDateString("id-ID", { day: "numeric", month: "long" }),
          slots,
        });
      }

      return NextResponse.json({
        fieldId: id,
        fieldName: field.name,
        pricePerHour: field.price,
        startDate: startDateStr,
        days,
      });
    }

    // Mode harian: satu tanggal
    const date = new Date(dateStr!);
    const bookedSlots = await prisma.orderItem.findMany({
      where: {
        fieldId: id,
        date,
        order: { status: "PAID" },
      },
      select: { startHour: true, endHour: true },
      orderBy: { startHour: "asc" },
    });

    const bookedHours = new Set<number>();
    for (const slot of bookedSlots) {
      for (let h = slot.startHour; h < slot.endHour; h++) {
        bookedHours.add(h);
      }
    }

    const now = new Date();
    const slots = [];
    for (let h = 8; h < 22; h++) {
      const isBooked = bookedHours.has(h);
      const isPast =
        date.toDateString() === now.toDateString()
          ? h <= now.getHours()
          : date < new Date(now.toDateString());

      slots.push({
        startHour: h,
        endHour: h + 1,
        label: `${String(h).padStart(2, "0")}:00 - ${String(h + 1).padStart(2, "0")}:00`,
        price: field.price,
        status: isPast ? "PAST" : isBooked ? "BOOKED" : "AVAILABLE",
      });
    }

    return NextResponse.json({
      fieldId: id,
      fieldName: field.name,
      pricePerHour: field.price,
      date: dateStr,
      slots,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}