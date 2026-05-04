import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { venueService } from "@/lib/services/venue.service"; // Pastikan importnya benar

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    const body = await req.json();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!body.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // PERBAIKAN: Tangkap body.title dan kirim ke service
    const image = await venueService.addImage(
      user.userId,
      user.role,
      id,
      body.url,
      body.title || "",
    );

    return NextResponse.json(image, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
