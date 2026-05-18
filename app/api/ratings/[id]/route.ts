import { NextRequest, NextResponse } from "next/server";
import { ratingService } from "@/lib/services/rating.service";
import { getAuth } from "@/lib/auth";

// PUT - Update rating
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rating, comment } = body;

    if (!rating && !comment) {
      return NextResponse.json(
        { error: "Minimal isi salah satu field (rating atau comment)" },
        { status: 400 },
      );
    }

    const updatedRating = await ratingService.updateRating(id, user.userId, {
      rating,
      comment,
    });

    return NextResponse.json({
      success: true,
      message: "Rating berhasil diperbarui",
      data: updatedRating,
    });
  } catch (err: any) {
    console.error("[PUT /api/ratings/:id] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengubah rating" },
      { status: 400 },
    );
  }
}

// DELETE - Delete rating
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ratingService.deleteRating(id, user.userId);

    return NextResponse.json({
      success: true,
      message: "Rating berhasil dihapus",
    });
  } catch (err: any) {
    console.error("[DELETE /api/ratings/:id] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus rating" },
      { status: 400 },
    );
  }
}
