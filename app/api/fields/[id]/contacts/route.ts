import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { fieldService } from "@/lib/services/field.service";

// POST /api/fields/[id]/contacts — tambah kontak
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromToken(req);
    const body = await req.json();
    const { id } = await params;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const contact = await fieldService.addContact(user.userId, user.role, id, {
      name: body.name,
      email: body.email,
      phone: body.phone,
    });

    return NextResponse.json(contact, { status: 201 });
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
