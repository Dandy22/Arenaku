import { NextRequest, NextResponse } from "next/server";
import { ratingService } from "@/lib/services/rating.service";
import { getAuth } from "@/lib/auth";

// POST - Create rating
export async function POST(req: NextRequest) {
  try {
    const user = await getAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, rating, comment } = body;

    // Validasi input
    if (!orderId || !rating) {
      return NextResponse.json(
        { error: "orderId dan rating wajib diisi" },
        { status: 400 },
      );
    }

    const newRating = await ratingService.createRating(
      user.userId,
      orderId,
      rating,
      comment || "",
    );

    return NextResponse.json(
      {
        success: true,
        message: "Rating berhasil dibuat",
        data: newRating,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[POST /api/ratings] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat rating" },
      { status: 400 },
    );
  }
}

// GET - Get ratings (berdasarkan vendorId atau userId)
export async function GET(req: NextRequest) {
  try {
    const vendorId = req.nextUrl.searchParams.get("vendorId");
    const userId = req.nextUrl.searchParams.get("userId");
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");

    if (vendorId) {
      const result = await ratingService.getRatingsByVendorId(
        vendorId,
        page,
        limit,
      );
      return NextResponse.json({
        success: true,
        data: result.ratings,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    }

    if (userId) {
      const result = await ratingService.getRatingsByUserId(
        userId,
        page,
        limit,
      );
      return NextResponse.json({
        success: true,
        data: result.ratings,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    }

    return NextResponse.json(
      { error: "Berikan vendorId atau userId" },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("[GET /api/ratings] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengambil ratings" },
      { status: 400 },
    );
  }
}
