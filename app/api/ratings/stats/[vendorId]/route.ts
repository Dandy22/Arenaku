import { NextRequest, NextResponse } from "next/server";
import { ratingService } from "@/lib/services/rating.service";

// GET - Get vendor rating stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> },
) {
  try {
    const { vendorId } = await params;
    const stats = await ratingService.getVendorRatingStats(vendorId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    console.error("[GET /api/ratings/stats/:vendorId] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengambil rating stats" },
      { status: 400 },
    );
  }
}
