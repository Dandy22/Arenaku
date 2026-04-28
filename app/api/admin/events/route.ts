// ============================================================
// app/api/admin/events/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Admin Event Management
//
//   - GET  : Get all events (admin only)
// ============================================================
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { eventService } from "@/lib/services/event.service";

// GET /api/admin/events
// Header: Authorization: Bearer <token>
// Response: Array of all events
export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can access this" }, { status: 403 });
    }

    const events = await eventService.getAdminEvents();
    return NextResponse.json(events);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}