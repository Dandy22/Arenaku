import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { fieldService } from "@/lib/services/field.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const field = await fieldService.getFieldById(id);
    return NextResponse.json(field);
  } catch (error: any) {
    if (error.message.includes("not found"))
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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
    const field = await fieldService.updateField(user.userId, user.role, id, {
      name: body.name,
      type: body.type,
      floorType: body.floorType,
      length: body.length,
      width: body.width,
      price: body.price,
      description: body.description,
      thumbnailUrl: body.thumbnailUrl,
    });
    return NextResponse.json(field);
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await fieldService.deleteField(user.userId, user.role, id);
    return NextResponse.json({ message: "Field deleted successfully" });
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
