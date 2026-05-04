// ============================================================
// app/api/upload/route.ts
// ------------------------------------------------------------
// File upload endpoint - menyimpan file ke folder public/uploads
// ============================================================

import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    // Verify user is authenticated
    await getUserFromToken(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // Jika ada file yang diupload
    if (file && file.size > 0) {
      // Validasi tipe file
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "Tipe file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP",
          },
          { status: 400 },
        );
      }

      // Validasi ukuran max 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file maksimal 5 MB" },
          { status: 400 },
        );
      }

      // Ambil ekstensi file
      const ext = file.name.split(".").pop() || "jpg";
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const fileName = `${uniqueSuffix}.${ext}`;

      // Buat direktori uploads jika belum ada
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Konversi file ke buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Simpan file
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      // Return URL file yang disimpan
      const imageUrl = `/uploads/${fileName}`;

      return NextResponse.json({
        success: true,
        url: imageUrl,
        message: "Foto berhasil diupload",
        originalName: file.name,
        size: file.size,
      });
    }

    return NextResponse.json(
      { error: "Tidak ada file yang diupload" },
      { status: 400 },
    );
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
