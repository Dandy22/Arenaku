import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { venueService } from "@/lib/services/venue.service";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const venue = await venueService.createVenue(user.userId, user.role, {
      name: body.name,
      description: body.description,
      city: body.city,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      district: body.district,
      thumbnailUrl: body.thumbnailUrl,
    });
    return NextResponse.json(venue, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token"))
      return NextResponse.json({ error: error.message }, { status: 401 });
    if (
      error.message.includes("Only vendors") ||
      error.message.includes("not verified")
    )
      return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const name = searchParams.get("name") || undefined;
    const city = searchParams.get("city") || undefined;
    const district = searchParams.get("district") || undefined;
    const type = searchParams.get("type") || undefined;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : 1;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 8;

    const isSearching = name || city || district || type;

    // Cek apakah ada token vendor
    try {
      const user = await getUserFromToken(req);
      if (!user) throw new Error("No user");

      if (user.role === "VENDOR" && !isSearching) {
        const myVenues = await venueService.getVendorVenues(
          user.userId,
          user.role,
        );
        return NextResponse.json(myVenues);
      }
    } catch {}

    // Mode publik dengan filter
    const result = await venueService.getAllVenues({
      name,
      city,
      district,
      type,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 },
    );
  }
}
