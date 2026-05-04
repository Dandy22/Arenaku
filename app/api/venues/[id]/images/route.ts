import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { venueService } from "@/lib/services/venue.service";

// POST /api/venues/[id]/images — tambah foto venue
export async function POST(
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

    if (!body.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // PERBAIKAN: Tambahkan body.title sebagai argumen ke-5
    const image = await venueService.addImage(
      user.userId,
      user.role,
      id,
      body.url,
      body.title || "",
    );

    return NextResponse.json(image, { status: 201 });
  } catch (error: any) {
    // ... rest of your error handling ...
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
