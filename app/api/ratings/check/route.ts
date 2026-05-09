import { NextRequest, NextResponse } from "next/server";
import { ratingService } from "@/lib/services/rating.service";
import { getAuth } from "@/lib/auth";

// GET - Check if user can rate this order
export async function GET(req: NextRequest) {
  try {
    const user = await getAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = req.nextUrl.searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId wajib diisi" },
        { status: 400 },
      );
    }

    const canRate = await ratingService.canUserRateOrder(user.userId, orderId);

    return NextResponse.json({
      success: true,
      canRate,
    });
  } catch (err: any) {
    console.error("[GET /api/ratings/check] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengecek rating" },
      { status: 400 },
    );
  }
}
