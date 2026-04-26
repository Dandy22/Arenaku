"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";

import Image from "next/image";
export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      const { token, user } = res.data;

      // simpan auth dulu
      setAuth(user, token);

      // kasih delay kecil supaya zustand selesai simpan
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

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #4C1D95 0%, #7C3AED 40%, #9333EA 70%, #C026D3 100%)",
      }}>
      {/* Background decorative circles */}
      <div
        className="absolute -top-[-100px] -right-[-100px] -w-[400px] -h-[400px] rounded-full opacity-20"
        style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}
      />
      <div
        className="absolute -bottom-[-150px] -left-[-100px] w-125 h-250] rounded-full opacity-15"
        style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
      />
      <div
        className="absolute top-[30%] left-[10%] w-50 h-50 rounded-full opacity-10"
        style={{ background: "linear-gradient(135deg, #EC4899, #F59E0B)" }}
      />

      {/* Vertical lines decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${10 + i * 12}%`,
              background:
                "linear-gradient(to bottom, transparent, #fff, transparent)",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex items-center justify-between gap-12">
        {/* Left — branding */}
        <div className="hidden lg:flex flex-col text-white flex-1">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              alt="Logo ArenaKu"
              width={160}
              height={160}
              src="LOGO-ARENAKU.svg"
            />
          </div>

          <div>
            <h1 className="text-6xl font-semibold leading-tight">
              Lebih dekat dengan
              <br />
              lapangan favoritmu
            </h1>
            <p className="mt-4 text-purple-200 text-lg">
              Booking venue olahraga dengan praktis
              <br />
              dalam satu platform.
            </p>
          </div>
        </div>

        {/* Right — form card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Logo mobile */}
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <Image
                alt="Logo ArenaKu"
                width={160}
                height={160}
                src="LOGO-ARENAKU-PURPLE.svg"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Selamat Datang</h2>
            <p className="text-gray-500 text-sm mt-1 mb-6">
              Akses akun Anda dan nikmati fitur lengkapnya
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
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

              {/* Password */}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? (
                      <HiEye size={18} />
                    ) : (
                      <HiEyeSlash size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl font-semibold text-white text-sm transition mt-2 disabled:opacity-60"
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
    </div>
  );
}
