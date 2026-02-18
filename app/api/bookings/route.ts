import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
// Route handler for creating a new booking and fetching user's bookings
export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);

    // only customers can book fields
    if (user.role !== "CUSTOMER") {
      return Response.json(
        { error: "Only customer can book field" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fieldId, date, startHour, endHour } = body;

    // cek konflik jadwal booking
    const existingBooking = await prisma.booking.findFirst({
        where: {
            fieldId,
            date: new Date(date),
            AND: [
                {
                    startHour: {
                        lt: endHour,
                    },
                },
                {
                    endHour: {
                        gt: startHour,
                    },
                },
            ],  
        }
    })

    if(existingBooking) {
        return Response.json(
            { error: "Time slot is already booked" },
            { status: 400 }
        );
    }

    // create booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.userId,
        fieldId,
        date: new Date(date),
        startHour,
        endHour,
        status: "PENDING",
      },
    });

    return Response.json(booking);
  } catch (error) {
    return Response.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);

    // Only customers can view their bookings
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        field: {
          include: {
            venue: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(bookings);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
