// ============================================================
// app/api/cart/[id]/route.ts
// ------------------------------------------------------------
// TIER 1 — Presentation Layer: Cart Item Delete
//
//   DELETE /api/cart/[id]  → hapus satu item dari cart
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { cartService } from "@/lib/services/cart.service";

// DELETE /api/cart/[id]
// Header: Authorization: Bearer <token>
// Response: item yang dihapus
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req);
    await cartService.removeFromCart(user.userId, params.id);
    return NextResponse.json({ message: "Item removed from cart" });
  } catch (error: any) {
    if (error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes("not authorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}