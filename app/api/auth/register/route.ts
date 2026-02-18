import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
// Route handler for user registration
export async function POST(req: Request) {
  const body = await req.json();

  const { name, email, phone, password, role } = body;

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 400 }
    );
  }
 // Hash the password before storing it in the database
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
  data: {
    name: body.name,
    email: body.email,
    phone: body.phone,
    password: hashedPassword,
    role: body.role || "CUSTOMER",
    vendorProfile:
      body.role === "VENDOR"
        ? { create: {} }
        : undefined,
  },
  include: {
    vendorProfile: true,
  },
});


  return NextResponse.json(user);
}
