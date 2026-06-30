"use client";

import { useEffect, useState } from "react";
import { Button, Input, message } from "antd";
import { HiOutlineUser, HiOutlineExclamationCircle } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function CustomerSettingsPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // State untuk form
  const [initialProfileForm, setInitialProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  //   STATE BARU: Khusus untuk menampung pesan error inline pada form
  const [formErrors, setFormErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Ambil data terbaru dari backend saat komponen dimuat
  useEffect(() => {
    if (user?.role === "CUSTOMER") {
      fetchProfile();
    } else if (user) {
      // Jika bukan customer tapi nyasar ke sini, arahkan ke dashboard
      router.push("/");
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/profile");
      const userData = res.data;

      const initialData = {
        name: userData?.name || "",
        phone: userData?.phone || "",
      };

      setProfileForm((prev) => ({ ...prev, ...initialData }));
      setInitialProfileForm(initialData);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || "Gagal mengambil data profil",
      );
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    //   Hapus error inline saat user mulai mengetik ulang di kotak tersebut
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isPasswordFilled =
    !!profileForm.currentPassword ||
    !!profileForm.newPassword ||
    !!profileForm.confirmPassword;

  // Cek apakah ada perubahan
  const isProfileChanged = () => {
    return (
      profileForm.name !== initialProfileForm.name ||
      profileForm.phone !== initialProfileForm.phone ||
      isPasswordFilled
    );
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // Reset error sebelum validasi
      setFormErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      let hasValidationError = false;
      const newErrors = {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };

      //   VALIDASI LOKAL (UX Lebh baik, tampilkan error di bawah input)
      if (isPasswordFilled) {
        if (!profileForm.currentPassword) {
          newErrors.currentPassword = "Password saat ini wajib diisi";
          hasValidationError = true;
        }
        if (profileForm.newPassword && profileForm.newPassword.length < 6) {
          newErrors.newPassword = "Password baru minimal 6 karakter";
          hasValidationError = true;
        }
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          newErrors.confirmPassword = "Konfirmasi password tidak cocok";
          hasValidationError = true;
        }
      }

      // Jika ada error validasi lokal, hentikan proses dan tampilkan error
      if (hasValidationError) {
        setFormErrors(newErrors);
        setLoading(false);
        return;
      }

      // Payload untuk update profil
      const payload: any = {
        phone: profileForm.phone,
      };

      if (profileForm.newPassword) {
        payload.currentPassword = profileForm.currentPassword;
        payload.newPassword = profileForm.newPassword;
      }

      // Kirim ke backend
      await axios.patch("/profile", payload);

      message.success("Profil berhasil diperbarui");

      // Update state aplikasi (Zustand & LocalStorage)
      if (user) {
        setAuth(
          { ...user, name: profileForm.name, phone: profileForm.phone },
          localStorage.getItem("token") || "",
        );
      }

      // Reset form ke state baru
      setInitialProfileForm({
        name: profileForm.name,
        phone: profileForm.phone,
      });

      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Gagal menyimpan profil";

      //   TANGKAP ERROR BACKEND: Jika error terkait password lama yang salah, tampilkan inline
      if (errorMsg.toLowerCase().includes("password")) {
        setFormErrors((prev) => ({ ...prev, currentPassword: errorMsg }));
      } else {
        message.error(errorMsg); // Tampilkan popup hanya untuk error sistem (500)
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "CUSTOMER") return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan Akun</h1>
        <p className="text-gray-500 mt-2">
          Kelola informasi personal dan keamanan akun Anda.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Tab */}
        <div className="border-b border-gray-100 px-8 py-4">
          <span className="flex items-center gap-2 font-bold text-purple-600 border-b-2 border-purple-600 pb-4 -mb-[17px] w-fit px-2">
            <HiOutlineUser size={20} /> Profil & Keamanan
          </span>
        </div>

        <div className="p-8 space-y-10 animate-in fade-in duration-500">
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Informasi Personal
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Nama Lengkap
                </label>
                <Input
                  value={profileForm.name}
                  disabled
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className="!h-12 !rounded-xl !text-base"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Nama lengkap tidak dapat diubah.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Email
                </label>
                <Input
                  value={user.email}
                  disabled
                  className="!h-12 !rounded-xl bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Email tidak dapat diubah karena terhubung dengan akun utama
                  Anda.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  No Telepon
                </label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  className="!h-12 !rounded-xl !text-base"
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Keamanan Akun
            </h2>
            <div className="space-y-5">
              {/*   KOTAK PASSWORD SAAT INI + ERROR INLINE */}
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Password Saat Ini
                </label>
                <Input.Password
                  value={profileForm.currentPassword}
                  onChange={(e) =>
                    handleProfileChange("currentPassword", e.target.value)
                  }
                  placeholder="Masukkan password lama"
                  className={`!h-12 !rounded-xl !text-base transition-colors ${
                    formErrors.currentPassword
                      ? "!border-red-500 focus:!border-red-500 focus:!shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"
                      : ""
                  }`}
                />
                {formErrors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1.5">
                    <HiOutlineExclamationCircle size={14} />
                    {formErrors.currentPassword}
                  </p>
                )}
              </div>

              {/*   KOTAK PASSWORD BARU + ERROR INLINE */}
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Password Baru
                </label>
                <Input.Password
                  value={profileForm.newPassword}
                  onChange={(e) =>
                    handleProfileChange("newPassword", e.target.value)
                  }
                  placeholder="Masukkan password baru (min 6 karakter)"
                  className={`!h-12 !rounded-xl !text-base transition-colors ${
                    formErrors.newPassword
                      ? "!border-red-500 focus:!border-red-500 focus:!shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"
                      : ""
                  }`}
                />
                {formErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1.5">
                    <HiOutlineExclamationCircle size={14} />
                    {formErrors.newPassword}
                  </p>
                )}
              </div>

              {/*   KOTAK KONFIRMASI PASSWORD + ERROR INLINE */}
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Konfirmasi Password Baru
                </label>
                <Input.Password
                  value={profileForm.confirmPassword}
                  onChange={(e) =>
                    handleProfileChange("confirmPassword", e.target.value)
                  }
                  placeholder="Ketik ulang password baru"
                  className={`!h-12 !rounded-xl !text-base transition-colors ${
                    formErrors.confirmPassword
                      ? "!border-red-500 focus:!border-red-500 focus:!shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"
                      : ""
                  }`}
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1.5">
                    <HiOutlineExclamationCircle size={14} />
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
            <Button
              type="primary"
              loading={loading}
              onClick={handleSaveProfile}
              disabled={!isProfileChanged()}
              className="!h-12 !px-10 !rounded-full !bg-purple-600 hover:!bg-purple-700 border-none shadow-lg shadow-purple-200 !font-bold !text-base disabled:!bg-gray-300 disabled:!shadow-none transition-all">
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
