import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { venueService } from "@/lib/services/venue.service";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    const { id, imageId } = await params;
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await venueService.deleteImage(user.userId, user.role, id, imageId);
    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error: any) {
    if (error.message.includes("token"))
      return NextResponse.json({ error: error.message }, { status: 401 });
    if (
      error.message.includes("Only vendors") ||
      error.message.includes("not authorized")
    )
      return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.message.includes("not found"))
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
