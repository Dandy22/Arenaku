import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { fieldService } from "@/lib/services/field.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const { contactId } = await params;
    const user = await getUserFromToken(req);
    const body = await req.json();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contact = await fieldService.updateContact(
      user.userId,
      user.role,
      contactId,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
    );
    return NextResponse.json(contact);
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
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const { contactId } = await params;
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await fieldService.deleteContact(user.userId, user.role, contactId);
    return NextResponse.json({ message: "Contact deleted successfully" });
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
