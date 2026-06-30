import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepository } from "@/lib/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification.service";
import { sendVerificationEmail } from "@/lib/mail";

// JWT Secret dari environment variable
const SECRET = process.env.JWT_SECRET || "SECRET_KEY_DEV_ONLY";

// Jumlah putaran hashing bcrypt — semakin tinggi semakin aman tapi semakin lambat
// 10 adalah nilai standar yang direkomendasikan untuk production
const BCRYPT_SALT_ROUNDS = 10;

export const authService = {
  // ----------------------------------------------------------
  // register
  // Mendaftarkan user baru ke sistem.
  // ----------------------------------------------------------
  async register(data: {
    name: string;
    vendorName?: string;
    email: string;
    phone: string;
    password: string;
    role?: "CUSTOMER" | "VENDOR" | "ADMIN";
    address?: string;
    district?: string;
  }) {
    // Step 1: Validasi field wajib — jangan simpan data tidak lengkap
    if (!data.name || !data.email || !data.password) {
      throw new Error("Name, email, and password are required");
    }

    // Step 2: Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Invalid email format");
    }

    // Step 3: Validasi panjang password minimal
    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Step 4: Cek apakah email sudah pernah terdaftar sebelumnya
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email is already registered");
    }

    // Step 5: Hash password — JANGAN pernah simpan password plain text ke database
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // Step 6: Untuk vendor, wajib ada address dan district
    if (data.role === "VENDOR") {
      if (!data.address) {
        throw new Error("Address is required for vendors");
      }
      if (!data.district) {
        throw new Error("District is required for vendors");
      }
      if (!data.vendorName || !data.vendorName.trim()) {
        throw new Error("Vendor name is required for vendors");
      }
    }

    // Step 7: Simpan user baru ke database via repository
    const newUser = await userRepository.create({
      name: data.name,
      vendorName: data.vendorName,
      email: data.email,
      phone: data.phone || "",
      password: hashedPassword,
      role: data.role ?? "CUSTOMER",
      address: data.address,
      district: data.district,
    });

    // Step 8: Generate token verifikasi email dan kirim email
    const emailVerificationToken = jwt.sign(
      {
        userId: newUser.id,
        type: "email_verification",
      },
      SECRET,
      {
        expiresIn: "24h",
      },
    );

    await sendVerificationEmail(newUser.email, emailVerificationToken);

    // Jika user register sebagai VENDOR, trigger notifikasi ke Admin
    if (data.role === "VENDOR" && newUser) {
      const vendorMember = await prisma.vendorMember.findFirst({
        where: { userId: newUser.id },
        include: { vendor: true },
      });

      if (vendorMember?.vendor) {
        await notificationService.notifyVendorRegister(vendorMember.vendor.id);
      }
    }

    // Hapus field password dari response
    const { password: _, ...userWithoutPassword } = newUser as any;
    return userWithoutPassword;
  },

  // ----------------------------------------------------------
  // login
  // Memverifikasi kredensial user dan mengembalikan JWT token.
  // ----------------------------------------------------------
  async login(email: string, password: string) {
    // Step 1: Validasi input tidak kosong
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Step 2: Cari user berdasarkan email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Step 3: Bandingkan password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Step 4: Pastikan email sudah diverifikasi sebelum login
    if (!user.isEmailVerified) {
      throw new Error(
        "Email belum diverifikasi. Silakan klik tautan verifikasi yang dikirim ke email Anda.",
      );
    }

    // ============================================================
    // AUTO-HEAL LOGIC: Perbaikan Role "Nyangkut" akibat Invite
    // ============================================================
    let finalRole = user.role;

    if (finalRole === "CUSTOMER") {
      const isVendorStaff = await prisma.vendorMember.findFirst({
        where: { userId: user.id },
      });

      if (isVendorStaff) {
        // Jika ternyata dia ada di tabel VendorMember, update secara permanen!
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "VENDOR" },
        });
        finalRole = "VENDOR"; // Update untuk sesi token kali ini
      }
    }
    // ============================================================

    // Step 4: Generate JWT token menggunakan finalRole
    const token = jwt.sign(
      {
        userId: user.id,
        role: finalRole,
      },
      SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Ambil vendor status JIKA user terdeteksi sebagai VENDOR (pakai finalRole)
    let vendorStatus: "PENDING" | "VERIFIED" | "REJECTED" | undefined;
    let vendorId: string | undefined;

    if (finalRole === "VENDOR") {
      const vendorMember = await prisma.vendorMember.findFirst({
        where: { userId: user.id },
        include: { vendor: true },
      });
      if (vendorMember) {
        vendorStatus = vendorMember.vendor.status;
        vendorId = vendorMember.vendor.id;
      }
    }

    // Kembalikan response lengkap
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: finalRole, // 👈 Pastikan kita kirimkan role yang sudah di-heal ke frontend
        vendorStatus,
        vendorId,
      },
    };
  },
};
