// ============================================================
// app/api/upload/route.ts
// ------------------------------------------------------------
// File upload endpoint - menyimpan file ke Cloudinary
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Konfigurasi Cloudinary (Pastikan variabel ini ada di .env dan Vercel)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    // 1. Verifikasi User (Token)
    await getUserFromToken(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Tidak ada file yang diupload" },
        { status: 400 },
      );
    }

    // 2. Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipe file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP",
        },
        { status: 400 },
      );
    }

    // 3. Validasi ukuran max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5 MB" },
        { status: 400 },
      );
    }

    // 4. Ubah file menjadi buffer lalu ke format Base64 (Syarat wajib Cloudinary)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    // 5. Upload langsung ke Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "arenaku_uploads", // Nama folder yang akan otomatis terbuat di Cloudinary
    });

    // 6. Return URL Cloudinary untuk disimpan ke database Neon
    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      message: "Foto berhasil diupload",
      originalName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error);

    if (error.message?.includes("token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || "Gagal upload foto" },
      { status: 500 },
    );
  }
}
