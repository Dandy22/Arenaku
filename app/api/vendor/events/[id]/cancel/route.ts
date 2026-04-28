// ============================================================
// app/api/vendor/events/[id]/cancel/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Vendor Cancel Event
//
//   - POST : Cancel an event (vendor only)
// ============================================================
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { eventService } from "@/lib/services/event.service";

// POST /api/vendor/events/[id]/cancel
// Header: Authorization: Bearer <token>
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(req);
    const { id: eventId } = await params;

    if (user.role !== "VENDOR") {
      return NextResponse.json({ error: "Only vendors can access this" }, { status: 403 });
    }

    const event = await eventService.cancelEvent(eventId, user.userId, user.role);
    return NextResponse.json(event);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}