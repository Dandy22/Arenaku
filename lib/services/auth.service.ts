// ============================================================
// lib/services/auth.service.ts
// ------------------------------------------------------------
//
// Service layer bertugas menangani semua logika bisnis.
// Untuk autentikasi, logika yang ditangani di sini:
//   - Validasi input register (field wajib, format, dll)
//   - Cek duplikat email
//   - Hash password sebelum disimpan
//   - Generate JWT token saat login
//
// ============================================================

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepository } from "@/lib/repositories/user.repository";

// JWT Secret dari environment variable
const SECRET = process.env.JWT_SECRET || "SECRET_KEY_DEV_ONLY";

// Jumlah putaran hashing bcrypt — semakin tinggi semakin aman tapi semakin lambat
// 10 adalah nilai standar yang direkomendasikan untuk production
const BCRYPT_SALT_ROUNDS = 10;

export const authService = {
  // ----------------------------------------------------------
  // register
  // Mendaftarkan user baru ke sistem.
  //
  // Langkah-langkah:
  //   1. Validasi field yang wajib diisi
  //   2. Cek apakah email sudah terdaftar
  //   3. Hash password menggunakan bcrypt
  //   4. Simpan user ke database via repository
  // ----------------------------------------------------------
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: "CUSTOMER" | "VENDOR" | "ADMIN";
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

    // Step 6: Simpan user baru ke database via repository
    const newUser = await userRepository.create({
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      password: hashedPassword, // password sudah di-hash
      role: data.role ?? "CUSTOMER",
    });

    // Hapus field password dari response agar tidak terkirim ke client
    const { password: _, ...userWithoutPassword } = newUser as any;
    return userWithoutPassword;
  },

  // ----------------------------------------------------------
  // login
  // Memverifikasi kredensial user dan mengembalikan JWT token.
  //
  // Langkah-langkah:
  //   1. Cari user berdasarkan email
  //   2. Bandingkan password dengan hash di database
  //   3. Generate JWT token jika valid
  // ----------------------------------------------------------
  async login(email: string, password: string) {
    // Step 1: Validasi input tidak kosong
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Step 2: Cari user berdasarkan email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Gunakan pesan yang generik agar tidak memberi tahu attacker
      // apakah email terdaftar atau tidak (security best practice)
      throw new Error("Invalid email or password");
    }

    // Step 3: Bandingkan password yang diinput dengan hash di database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Step 4: Generate JWT token yang berisi userId dan role
    // Token ini akan dipakai sebagai identitas user di setiap request berikutnya
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      SECRET,
      {
        expiresIn: "7d", // token expired setelah 7 hari
      }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        // password TIDAK disertakan dalam response
      },
    };
  },
};