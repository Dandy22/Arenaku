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

// GET /api/venues?name=arena&district=bekasi&type=futsal&page=1&limit=8
// GET /api/venues?name=arena&district=bekasi&type=futsal&page=1&limit=8
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Cek apakah ada token vendor
    try {
      const user = await getUserFromToken(req);
      // PERBAIKAN: Jangan return 401 di sini. Lempar error agar ditangkap catch
      // dan diteruskan ke "mode publik" di bawah
      if (!user) throw new Error("No user");

      if (user.role === "VENDOR") {
        const myVenues = await venueService.getVendorVenues(
          user.userId,
          user.role,
        );
        return NextResponse.json(myVenues);
      }
    } catch {
      /* tidak ada token / token invalid → Lanjut ke mode publik */
    }

    // Mode publik dengan filter
    const result = await venueService.getAllVenues({
      name: searchParams.get("name") || undefined,
      city: searchParams.get("city") || undefined,
      district: searchParams.get("district") || undefined,
      type: searchParams.get("type") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 8,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 },
    );
  }
}
