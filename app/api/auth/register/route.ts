// ============================================================
// app/api/auth/register/route.ts
// ============================================================
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      vendorName,
      email,
      phone,
      password,
      role,
      address,
      district,
    } = body;

    const user = await authService.register({
      name,
      vendorName,
      email,
      phone,
      password,
      role,
      address,
      district,
    });

    return NextResponse.json(
      { message: "Registration successful", user },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 400 },
    );
  }
}
