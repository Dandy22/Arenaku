import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { venueService } from "@/lib/services/venue.service";

// GET /api/venues/[id] — publik, detail satu venue
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const venue = await venueService.getVenueById(id);
    return NextResponse.json(venue);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/venues/[id] — edit venue (VENDOR & pemilik only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const body = await req.json();
    const { id } = await params;

    const venue = await venueService.updateVenue(user.userId, user.role, id, {
      name: body.name,
      description: body.description,
      city: body.city,
      district: body.district,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      thumbnailUrl: body.thumbnailUrl,
    });

    return NextResponse.json(venue);
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (
      error.message.includes("Only vendors") ||
      error.message.includes("not authorized")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/venues/[id] — hapus venue (VENDOR & pemilik only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { id } = await params;
    await venueService.deleteVenue(user.userId, user.role, id);
    return NextResponse.json({ message: "Venue deleted successfully" });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (
      error.message.includes("Only vendors") ||
      error.message.includes("not authorized")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
