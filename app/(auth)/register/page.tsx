"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HiEye, HiEyeSlash, HiChevronDown, HiChevronUp } from "react-icons/hi2";
import api from "@/lib/axios";

type Role = "CUSTOMER" | "VENDOR";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("CUSTOMER");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      setError("Anda harus menyetujui Syarat & Ketentuan.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", { ...form, role });
      router.push("/login?registered=1");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registrasi gagal. Coba lagi.");
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
        className="absolute top-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full opacity-20"
        style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}
      />
      <div
        className="absolute bottom-[-120px] left-[-80px] w-[450px] h-[450px] rounded-full opacity-15"
        style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
      />

      {/* Vertical lines */}
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

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex items-center justify-between gap-12 py-10">
        {/* Left — branding */}
        <div className="hidden lg:flex flex-col gap-6 text-white flex-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Image
                alt="Logo ArenaKu"
                width={160}
                height={160}
                src="LOGO-ARENAKU.svg"
              />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight">
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
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <Image
                alt="Logo ArenaKu"
                width={160}
                height={160}
                src="LOGO-ARENAKU-PURPLE.svg"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Buat Akun</h2>
            <p className="text-gray-500 text-sm mt-1 mb-5">
              Buat akun Anda untuk nikmati fitur lengkapnya
            </p>

            {/* Role toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
              {(["CUSTOMER", "VENDOR"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                    role === r
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {r === "CUSTOMER" ? "Pengguna" : "Vendor"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                  className="text-slate-800 placeholder:text-slate-400 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nomor Ponsel
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50">
                    +62 <HiChevronDown size={14} />
                  </div>
                  <input
                    type="tel"
                    placeholder="Masukkan nomor ponselmu"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    required
                    className="text-slate-800 placeholder:text-slate-400 flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="text-slate-800 placeholder:text-slate-400 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition"
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
                    minLength={6}
                    className="text-slate-800 placeholder:text-slate-400 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition pr-12"
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

              {/* Agree checkbox */}
              <label className="flex items-start gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 accent-purple-600"
                />
                <span className="text-xs text-gray-500">
                  Saya telah membaca dan menyetujui{" "}
                  <span className="text-purple-600 font-medium cursor-pointer hover:underline">
                    Syarat & Ketentuan
                  </span>{" "}
                  dan{" "}
                  <span className="text-purple-600 font-medium cursor-pointer hover:underline">
                    Kebijakan Privasi
                  </span>
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition ">
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-2xl text-white text-sm font-semibold transition disabled:opacity-60"
                  style={{
                    background: loading
                      ? "#9CA3AF"
                      : "linear-gradient(135deg, #7C3AED, #9333EA)",
                  }}>
                  {loading ? "Memuat..." : "Lanjut"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
