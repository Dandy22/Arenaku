"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiEye, HiEyeSlash, HiChevronDown } from "react-icons/hi2";

import api from "@/lib/axios";
import { BEKASI_DISTRICTS } from "@/lib/constants";

type Role = "CUSTOMER" | "VENDOR";

type FormState = {
  name: string;
  vendorName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  district: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  vendorName: "",
  email: "",
  phone: "",
  password: "",
  address: "",
  district: "",
};

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("CUSTOMER");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // State untuk menampung error spesifik & umum
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const districtOptions = BEKASI_DISTRICTS.filter((d) => d.value !== "");

  // --- LOGIKA VALIDASI ---
  const validateField = (field: string, value: string, currentRole: Role) => {
    let error = "";
    if (field === "name" && !value.trim()) error = "* nama wajib diisi";

    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) error = "* email wajib diisi";
      else if (!emailRegex.test(value)) error = "* format email salah";
    }

    if (field === "phone") {
      const phoneRegex = /^(08|8)[0-9]{8,11}$/;
      if (!value.trim()) error = "* nomor ponsel wajib diisi";
      else if (!phoneRegex.test(value))
        error = "* nomor tidak valid (10-13 angka)";
    }

    if (field === "password") {
      if (!value) error = "* password wajib diisi";
      else if (value.length < 6) error = "* password minimal 6 karakter";
    }

    if (currentRole === "VENDOR") {
      if (field === "vendorName" && !value.trim())
        error = "* nama vendor / nama bisnis wajib diisi";
      if (field === "district" && !value) error = "* kecamatan wajib dipilih";
      if (field === "address" && !value.trim()) error = "* alamat wajib diisi";
    }
    return error;
  };

  const handleBlur = (field: keyof FormState) => {
    const error = validateField(field, form[field], role);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));

      // HAPUS generalError setiap kali user mengetik/memilih sesuatu
      setGeneralError("");

      setFieldErrors((prev) => {
        if (prev[key]) {
          const error = validateField(key, value as string, role);
          return { ...prev, [key]: error };
        }
        return prev;
      });
    },
    [role],
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Tentukan field mana saja yang wajib divalidasi berdasarkan role
    const fieldsToValidate: Array<keyof FormState> = [
      "name",
      "email",
      "phone",
      "password",
    ];

    if (role === "VENDOR") {
      fieldsToValidate.push("vendorName", "district", "address");
    }

    fieldsToValidate.forEach((key) => {
      const err = validateField(key, form[key], role);
      if (err) {
        errors[key] = err;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    if (!agree) {
      setGeneralError("Anda harus menyetujui Syarat & Ketentuan.");
      return;
    }

    setLoading(true);

    // Auto-Format Nama (Tiap awal kata jadi Huruf Besar)
    const formattedName = form.name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    try {
      await api.post("/auth/register", {
        ...form,
        name: formattedName,
        role,
      });
      router.push("/login?registered=1");
    } catch (err: any) {
      setGeneralError(
        err.response?.data?.error || "Registrasi gagal. Coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden pb-24"
      style={{
        background:
          "linear-gradient(135deg, #4C1D95 0%, #7C3AED 40%, #9333EA 70%, #C026D3 100%)",
      }}>
      {/* Background */}
      <Image
        src="/Circle.svg"
        alt="circle"
        width={600}
        height={600}
        className="absolute right-1/3 top-0 opacity-20 lg:opacity-100"
      />
      <Image
        src="/CircleHalf.svg"
        alt="circle"
        width={600}
        height={600}
        className="absolute -right-4 -bottom-32 opacity-20 lg:opacity-100"
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between p-6 lg:p-0 gap-24 mt-8">
        {/* LEFT */}
        <div className="hidden md:flex flex-col gap-7 text-white">
          <Image src="/LOGO-ARENAKU.svg" alt="logo" width={160} height={160} />
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold">
              Lebih dekat dengan lapangan favoritmu
            </h1>
            <p className="text-slate-200 font-semibold text-lg">
              Booking venue olahraga dengan praktis dalam satu platform.
            </p>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white w-full rounded-lg shadow-lg lg:p-16 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Buat Akun</h1>
            <p className="text-slate-400">
              Buat akun Anda untuk nikmati fitur lengkapnya
            </p>
          </div>

          {/* ROLE SWITCH */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
            {(["CUSTOMER", "VENDOR"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setFieldErrors({});
                  setGeneralError("");
                }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                  role === r
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500"
                }`}>
                {r === "CUSTOMER" ? "Pengguna" : "Vendor"}
              </button>
            ))}
          </div>

          {/* FORM - SEMUA INPUT MASUK KE SINI */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
            noValidate>
            {/* 1. BAGIAN DATA PRIBADI */}
            <Input
              label="Nama Lengkap"
              required
              value={form.name}
              error={fieldErrors.name}
              onChange={(v) => updateForm("name", v)}
              onBlur={() => handleBlur("name")}
              placeholder="Masukkan nama lengkap"
            />

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Nomor Ponsel <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div
                  className={`flex items-center gap-1 px-3 py-2.5 border rounded-lg bg-gray-50 text-sm transition ${fieldErrors.phone ? "border-red-500" : "border-gray-200"}`}>
                  +62 <HiChevronDown size={14} />
                </div>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    updateForm("phone", e.target.value.replace(/[^0-9]/g, ""))
                  }
                  onBlur={() => handleBlur("phone")}
                  placeholder="Contoh: 081234567890"
                  className={`flex-1 px-4 py-2.5 border rounded-lg text-sm outline-none transition ${
                    fieldErrors.phone
                      ? "border-red-500 focus:ring-1 focus:ring-red-100"
                      : "border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-100"
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-red-500 text-[11px] italic mt-1 font-medium">
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* 2. BAGIAN DATA BISNIS (JIKA VENDOR) */}
            {role === "VENDOR" && (
              <>
                <Input
                  label="Nama Vendor / Bisnis"
                  required
                  value={form.vendorName}
                  error={fieldErrors.vendorName}
                  onChange={(v) => updateForm("vendorName", v)}
                  onBlur={() => handleBlur("vendorName")}
                  placeholder="Contoh: PT. Arena Prestasi"
                />
                <Select
                  label="Kecamatan"
                  value={form.district}
                  options={districtOptions}
                  error={fieldErrors.district}
                  onChange={(v) => updateForm("district", v)}
                  onBlur={() => handleBlur("district")}
                />
                <Input
                  label="Alamat Lengkap"
                  value={form.address}
                  error={fieldErrors.address}
                  onChange={(v) => updateForm("address", v)}
                  onBlur={() => handleBlur("address")}
                  placeholder="Contoh: Jl. Sudirman..."
                />
              </>
            )}

            {/* 3. BAGIAN DATA AKUN */}
            <Input
              label="Email"
              required
              type="email"
              value={form.email}
              error={fieldErrors.email}
              onChange={(v) => updateForm("email", v)}
              onBlur={() => handleBlur("email")}
              placeholder="Masukkan emailmu"
            />

            <PasswordInput
              value={form.password}
              show={showPassword}
              error={fieldErrors.password}
              onToggle={() => setShowPassword((p) => !p)}
              onChange={(v) => updateForm("password", v)}
              onBlur={() => handleBlur("password")}
            />

            {/* AGREEMENT */}
            <label className="flex items-start gap-2 text-xs text-gray-500 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  setGeneralError("");
                }}
                className="mt-0.5 accent-purple-600"
              />
              <span>
                Saya menyetujui{" "}
                <span className="text-purple-600 font-medium hover:underline">
                  Syarat & Ketentuan
                </span>{" "}
                dan{" "}
                <span className="text-purple-600 font-medium hover:underline">
                  Kebijakan Privasi
                </span>
              </span>
            </label>

            {/* GENERAL ERROR */}
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mt-1">
                {generalError}
              </div>
            )}

            {/* BUTTON */}
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex-1 py-2.5 border border-slate-200 rounded-2xl text-gray-500 text-sm font-semibold hover:bg-gray-50 transition cursor-pointer">
                Kembali
              </button>

              <button
                disabled={loading}
                type="submit"
                className="flex-1 py-2.5 rounded-2xl text-white text-sm font-semibold transition cursor-pointer disabled:opacity-70"
                style={{
                  background: loading
                    ? "#9CA3AF"
                    : "linear-gradient(135deg,#7C3AED,#9333EA)",
                }}>
                {loading ? "Memuat..." : "Lanjut"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ===================== SMALL COMPONENTS ===================== */

function Input({
  label,
  error,
  onBlur,
  ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition ${
          error
            ? "border-red-500 focus:ring-1 focus:ring-red-100"
            : "border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-100"
        }`}
      />
      {error && (
        <p className="text-red-500 text-[11px] italic mt-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordInput({
  value,
  show,
  error,
  onToggle,
  onChange,
  onBlur,
}: {
  value: string;
  show: boolean;
  error?: string;
  onToggle: () => void;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 block mb-1">
        Password <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          minLength={6}
          className={`w-full px-4 py-2.5 border rounded-lg pr-12 text-sm outline-none transition ${
            error
              ? "border-red-500 focus:ring-1 focus:ring-red-100"
              : "border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-100"
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <HiEye size={18} /> : <HiEyeSlash size={18} />}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-[11px] italic mt-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  error,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  error?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white outline-none transition ${
          error
            ? "border-red-500 focus:ring-1 focus:ring-red-100"
            : "border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-100"
        }`}>
        <option value="">Pilih {label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-500 text-[11px] italic mt-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
