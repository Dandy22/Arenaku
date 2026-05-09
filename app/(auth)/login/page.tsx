"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import { message } from "antd";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tangkap query parameter dari URL
  useEffect(() => {
    const isRegistered = searchParams.get("registered");
    const isVerified = searchParams.get("verified");

    if (isRegistered === "1") {
      message.info({
        content:
          "Akun berhasil dibuat! Silakan verifikasi email Anda sebelum login. Periksa folder SPAM jika tidak menemukan email verifikasi.",
        duration: 5,
      });
    }

    if (isVerified === "1") {
      message.success({
        content: "Email berhasil diverifikasi! Silakan login dengan akun Anda.",
        duration: 5,
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      const { token, user } = res.data;

      // simpan auth dulu
      setAuth(user, token);

      setTimeout(() => {
        if (user.role === "ADMIN") {
          router.replace("/admin");
        } else if (user.role === "VENDOR") {
          router.replace("/vendor");
        } else {
          router.replace("/");
        }
      }, 200);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Login gagal. Periksa email dan password.";

      // Tampilkan error dengan message API (tidak merefresh halaman)
      message.error(errorMsg);
      setError(""); // Clear inline error since we're using message notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #4C1D95 0%, #7C3AED 40%, #9333EA 70%, #C026D3 100%)",
      }}>
      <Image
        alt="circle"
        src="/Circle.svg"
        width={600}
        height={600}
        className="absolute right-1/3 top-0 object-cover object-center opacity-20 lg:opacity-100"
      />

      <Image
        alt="circle"
        src="/CircleHalf.svg"
        width={600}
        height={600}
        className="absolute -right-4 -bottom-32 opacity-20 lg:opacity-100"
      />
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between p-6 lg:p-0 gap-24">
        {/* LOGO KIRI */}
        <div className="hidden md:flex flex-col gap-7">
          <Image src="/LOGO-ARENAKU.svg" alt="Logo" width={160} height={160} />
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold text-white">
              Lebih dekat dengan lapangan favoritmu
            </h1>
            <p className="text-slate-200 font-semibold text-lg">
              Booking venue olahraga dengan praktis dalam satu platform.
            </p>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-lg w-full h-auto lg:p-16 p-8 shadow-lg flex-col justify-between gap-6">
          {/* LOGO MOBILE */}
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <Image
              alt="Logo ArenaKu"
              width={160}
              height={160}
              src="LOGO-ARENAKU-PURPLE.svg"
            />
          </div>
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl font-bold">Selamat Datang</h1>
            <p className="text-slate-400">
              Akses Akun Anda dan nikmati fiturnya
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Masukkan emailmu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="text-slate-800 placeholder:text-slate-400 w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition"
              />
            </div>
            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  className="text-slate-800 placeholder:text-slate-400 w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  {showPassword ? (
                    <HiEye size={18} />
                  ) : (
                    <HiEyeSlash size={18} />
                  )}
                </button>
              </div>
            </div>
            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold text-white text-sm transition mt-2 disabled:opacity-60 cursor-pointer"
              style={{
                background: loading
                  ? "#9CA3AF"
                  : "linear-gradient(135deg, #7C3AED, #9333EA)",
              }}>
              {loading ? "Memuat..." : "Masuk"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Tidak punya akun?{" "}
            <Link
              href="/register"
              className="text-purple-600 font-semibold hover:underline">
              Buat Akun
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
