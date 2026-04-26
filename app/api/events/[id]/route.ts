import { NextResponse } from "next/server";
import { eventService } from "@/lib/services/event.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await eventService.getEventById(id);
    return NextResponse.json(event);
  } catch (error: any) {
    if (error.message.includes("not found")) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}