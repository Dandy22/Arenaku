import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

// Route handler for fetching events
export async function POST(req: Request){
    try {
        const user = await getUserFromToken(req);
        const body = await req.json();
        const { eventId } = body;

        // check if event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {participants: true}
        });
        if (!event) {
        return NextResponse.json(
            { error: "Event not found" },
            { status: 404 }
        );
    }

    // check event capacity
    if (event.participants.length >= event.capacity) {
        return NextResponse.json(
            { error: "Event is full" },
            { status: 400 }
        );
    }
    // check if user already joined
    const alreadyJoined = await prisma.eventParticipant.findFirst({
        where: {
            eventId,
            userId: user.userId,
        },
    });

    if (alreadyJoined) {
        return NextResponse.json(
            { error: "User already joined this event" },
            { status: 400 }
        );
    }

    // join event
    const join = await prisma.eventParticipant.create({
        data: {
            eventId,
            userId: user.userId,
        },
    });

    return NextResponse.json(join);
    }   catch (error) {
        return NextResponse.json(
            { error: "Failed to join event" },
            { status: 500 }
        );
    }
}