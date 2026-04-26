import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { fieldService } from "@/lib/services/field.service";

// POST /api/fields/[id]/images — tambah foto lapangan
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    const body = await req.json();

    if (!body.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const image = await fieldService.addImage(user.userId, user.role, id, body.url);
    return NextResponse.json(image, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("Only vendors") || error.message.includes("not authorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}