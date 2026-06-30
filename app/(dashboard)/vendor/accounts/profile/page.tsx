"use client";

import { useState, useEffect } from "react";
import { Button, Input, Select, Tabs, message } from "antd";
import { HiOutlineUser, HiOutlineBuildingStorefront } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import axios from "@/lib/axios";
import { useSearchParams } from "next/navigation";

interface VendorData {
  id: string;
  name: string;
  description: string;
  status: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

const BANK_OPTIONS = [
  { value: "BCA", label: "BCA" },
  { value: "BNI", label: "BNI" },
  { value: "BRI", label: "BRI" },
  { value: "MANDIRI", label: "Mandiri" },
  { value: "BTN", label: "BTN" },
  { value: "CIMB", label: "CIMB Niaga" },
  { value: "DANAMON", label: "Danamon" },
  { value: "MAYBANK", label: "Maybank" },
  { value: "PANIN", label: "Panin Bank" },
  { value: "SINARMAS", label: "Bank Sinarmas" },
];

// --- ATURAN VALIDASI REKENING BANK ---
const BANK_RULES: Record<string, { min: number; max: number; msg: string }> = {
  BCA: { min: 10, max: 10, msg: "Nomor rekening BCA harus 10 digit angka" },
  MANDIRI: {
    min: 13,
    max: 13,
    msg: "Nomor rekening Mandiri harus 13 digit angka",
  },
  BNI: { min: 10, max: 10, msg: "Nomor rekening BNI harus 10 digit angka" },
  BRI: { min: 15, max: 15, msg: "Nomor rekening BRI harus 15 digit angka" },
  BTN: { min: 16, max: 16, msg: "Nomor rekening BTN harus 16 digit angka" },
};

export default function VendorSettingsPage() {
  const { user, setAuth } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [initialProfileForm, setInitialProfileForm] = useState({
    name: "",
    vendorName: "",
    phone: "",
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    vendorName: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Bank form state
  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });

  // Initial Bank form state (DITAMBAHKAN)
  const [initialBankForm, setInitialBankForm] = useState({
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });

  // Bank Error State
  const [bankErrors, setBankErrors] = useState({
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });

  // Vendor data from API
  const [vendorData, setVendorData] = useState<VendorData | null>(null);

  const [vendorRole, setVendorRole] = useState<"OWNER" | "STAFF" | null>(null);

  // Proteksi: Hanya VENDOR role yang bisa akses
  const isVendor = user?.role === "VENDOR";

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "2") {
      setActiveTab("2");
    } else {
      setActiveTab("1");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.role === "VENDOR") {
      fetchProfile();
    }
  }, [user?.role]);

  const isPasswordFilled =
    !!profileForm.currentPassword ||
    !!profileForm.newPassword ||
    !!profileForm.confirmPassword;

  const isProfileChanged = () => {
    return (
      profileForm.name !== initialProfileForm.name ||
      (vendorRole === "OWNER" &&
        profileForm.vendorName !== initialProfileForm.vendorName) ||
      profileForm.phone !== initialProfileForm.phone ||
      isPasswordFilled
    );
  };

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await axios.get("/vendor/profile");
      // Asumsi API kamu mengembalikan `vendorRole` (seperti yang ada di DashboardLayout)
      const { user: userData, vendor, vendorRole: roleFromApi } = res.data;
      console.log("DATA DARI BACKEND:", res.data);
      if (roleFromApi) setVendorRole(roleFromApi);

      setProfileForm((prev) => {
        const newData = {
          ...prev,
          name: userData?.name || "",
          vendorName: vendor?.name || "",
          phone: userData?.phone || "",
        };

        setInitialProfileForm({
          name: newData.name,
          vendorName: newData.vendorName,
          phone: newData.phone,
        });

        return newData;
      });

      if (vendor) {
        const bankData = {
          bankName: vendor.bankName || "",
          bankAccountNumber: vendor.bankAccountNumber || "",
          bankAccountName: vendor.bankAccountName || "",
        };

        setVendorData(vendor);
        setBankForm(bankData);
        setInitialBankForm(bankData); //   simpan data awal
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to fetch profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const isBankFormChanged = () => {
    return (
      bankForm.bankName !== initialBankForm.bankName ||
      bankForm.bankAccountNumber !== initialBankForm.bankAccountNumber ||
      bankForm.bankAccountName !== initialBankForm.bankAccountName
    );
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field: string, value: string) => {
    setBankForm((prev) => ({ ...prev, [field]: value }));
    // Hapus error saat user mulai mengetik ulang
    setBankErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      if (profileForm.newPassword) {
        if (!profileForm.currentPassword) {
          message.error(
            "Password saat ini wajib diisi untuk mengubah password",
          );
          return;
        }
        if (profileForm.newPassword.length < 6) {
          message.error("Password baru minimal 6 karakter");
          return;
        }
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          message.error("Konfirmasi password tidak cocok");
          return;
        }
      }

      // Hanya kirim vendorName jika yang ngedit adalah OWNER
      const payload: any = {
        name: profileForm.name,
        phone: profileForm.phone,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
      };

      if (vendorRole === "OWNER") {
        payload.vendorName = profileForm.vendorName;
      }

      await axios.put("/vendor/profile", payload);

      message.success("Profil berhasil diperbarui");
      if (user) {
        setAuth(
          { ...user, name: profileForm.name, phone: profileForm.phone },
          localStorage.getItem("token") || "",
        );
      }

      setInitialProfileForm({
        name: profileForm.name,
        vendorName: profileForm.vendorName,
        phone: profileForm.phone,
      });

      setInitialBankForm({
        bankName: bankForm.bankName,
        bankAccountNumber: bankForm.bankAccountNumber,
        bankAccountName: bankForm.bankAccountName,
      });

      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      message.error(error.response?.data?.error || "Gagal menyimpan profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async () => {
    // Pastikan cuma OWNER yang bisa save bank (dobel proteksi)
    if (vendorRole !== "OWNER") {
      message.error("Hanya Owner yang dapat mengubah data bank.");
      return;
    }

    // 1. Reset Errors
    let hasError = false;
    const newErrors = {
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
    };

    // 2. Validasi Kosong
    if (!bankForm.bankName) {
      newErrors.bankName = "Bank wajib dipilih";
      hasError = true;
    }
    if (!bankForm.bankAccountName) {
      newErrors.bankAccountName = "Nama pemilik rekening wajib diisi";
      hasError = true;
    }
    if (!bankForm.bankAccountNumber) {
      newErrors.bankAccountNumber = "Nomor rekening wajib diisi";
      hasError = true;
    } else {
      // 3. Validasi Angka & Panjang Karakter (Khusus Bank)
      const cleanNumber = bankForm.bankAccountNumber.replace(/\s/g, ""); // buang spasi

      if (!/^\d+$/.test(cleanNumber)) {
        newErrors.bankAccountNumber = "Nomor rekening hanya boleh berisi angka";
        hasError = true;
      } else {
        const rule = BANK_RULES[bankForm.bankName] || {
          min: 10,
          max: 16,
          msg: "Nomor rekening tidak valid (10-16 digit)",
        };
        if (cleanNumber.length < rule.min || cleanNumber.length > rule.max) {
          newErrors.bankAccountNumber = rule.msg;
          hasError = true;
        }
      }
    }

    setBankErrors(newErrors);

    if (hasError) {
      message.error("Mohon periksa kembali isian form Anda");
      return;
    }

    try {
      setLoading(true);
      await axios.put("/vendor/profile/bank", {
        bankName: bankForm.bankName,
        bankAccountNumber: bankForm.bankAccountNumber.replace(/\s/g, ""),
        bankAccountName: bankForm.bankAccountName,
      });

      message.success("Data bank berhasil diperbarui");
      fetchProfile(); // Refresh data untuk update status badge
    } catch (error: any) {
      message.error(error.response?.data?.error || "Gagal menyimpan data bank");
    } finally {
      setLoading(false);
    }
  };

  if (!isVendor) {
    return (
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pengaturan Akun</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-gray-500">Halaman ini hanya untuk vendor.</p>
        </div>
      </div>
    );
  }

  // --- LOGIKA CERDAS STATUS BADGE ---
  const getDisplayStatus = () => {
    if (!vendorData) return null;

    if (vendorData.status === "PENDING") {
      // Jika nomor rekening masih kosong = Belum Lengkap
      if (!vendorData.bankAccountNumber) {
        return {
          text: "BELUM LENGKAP",
          className: "bg-gray-100 text-gray-600 border border-gray-200",
        };
      }
      // Jika sudah diisi = Menunggu Verifikasi
      return {
        text: "PENDING",
        className: "bg-amber-50 text-amber-600 border border-amber-100",
      };
    }

    if (vendorData.status === "VERIFIED") {
      return {
        text: "VERIFIED",
        className: "bg-green-50 text-green-600 border border-green-100",
      };
    }

    if (vendorData.status === "REJECTED") {
      return {
        text: "REJECTED",
        className: "bg-red-50 text-red-600 border border-red-100",
      };
    }

    return null;
  };

  const getNotificationMessage = () => {
    if (!vendorData) return null;
    if (vendorData.status === "PENDING" && vendorRole === "OWNER") {
      // Hanya tampilkan pesan alert setup akun ke OWNER
      if (!vendorData.bankAccountNumber) {
        return "Silakan isi data rekening terlebih dahulu sebelum membuat venue.";
      } else {
        return "Akun Anda dalam tahap peninjauan. Tunggu verifikasi dari admin.";
      }
    }
    return null;
  };

  const displayStatus = getDisplayStatus();
  const notificationMessage = getNotificationMessage();

  const tabItems = [
    {
      key: "1",
      label: (
        <span className="flex items-center gap-2 py-2 font-semibold">
          <HiOutlineUser size={18} /> Profil & Keamanan
        </span>
      ),
      children: (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Informasi Personal
            </h2>
            <div className="space-y-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Nama Lengkap
                </label>
                <Input
                  value={profileForm.name}
                  disabled
                  className="!h-11 !rounded-lg bg-gray-50 text-gray-400"
                />
              </div>

              {/* Hanya OWNER yang bisa mengganti nama Vendor, STAFF hanya bisa lihat */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Nama Vendor / Nama Bisnis
                </label>
                <Input
                  value={profileForm.vendorName}
                  onChange={(e) =>
                    handleProfileChange("vendorName", e.target.value)
                  }
                  placeholder="Masukkan nama vendor"
                  className={`!h-11 !rounded-lg ${vendorRole !== "OWNER" ? "bg-gray-50 text-gray-400" : ""}`}
                  disabled={vendorRole !== "OWNER"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Email
                </label>
                <Input
                  value={user?.email}
                  disabled
                  className="!h-11 !rounded-lg bg-gray-50 text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  No Telepon
                </label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  className="!h-11 !rounded-lg"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Keamanan Akun
            </h2>
            <div className="space-y-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Password saat ini
                </label>
                <Input.Password
                  value={profileForm.currentPassword}
                  onChange={(e) =>
                    handleProfileChange("currentPassword", e.target.value)
                  }
                  placeholder="Masukkan password saat ini"
                  className="!h-11 !rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Password Baru
                </label>
                <Input.Password
                  value={profileForm.newPassword}
                  onChange={(e) =>
                    handleProfileChange("newPassword", e.target.value)
                  }
                  placeholder="Masukkan password baru (min 6 karakter)"
                  className="!h-11 !rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Konfirmasi Password
                </label>
                <Input.Password
                  value={profileForm.confirmPassword}
                  onChange={(e) =>
                    handleProfileChange("confirmPassword", e.target.value)
                  }
                  placeholder="Masukkan password baru lagi"
                  className="!h-11 !rounded-lg"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              type="primary"
              loading={loading}
              onClick={handleSaveProfile}
              disabled={!isProfileChanged()}
              className="!h-11 !px-10 !rounded-full !bg-[#7C3AED] border-none shadow-lg shadow-purple-100 !font-bold">
              Simpan Profil
            </Button>
          </div>
        </div>
      ),
    },
  ];

  if (vendorRole === "OWNER") {
    tabItems.push({
      key: "2",
      label: (
        <span className="flex items-center gap-2 py-2 font-semibold">
          <HiOutlineBuildingStorefront size={18} /> Detail Bank
        </span>
      ),
      children: (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Informasi Rekening Bank
              </h2>
              {displayStatus && (
                <span
                  className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${displayStatus.className}`}>
                  {displayStatus.text}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <Select
                  className={`w-full !h-11 ${bankErrors.bankName ? "[&_.ant-select-selector]:!border-red-500" : ""}`}
                  placeholder="Pilih Bank"
                  value={bankForm.bankName || undefined}
                  onChange={(value) => handleBankChange("bankName", value)}
                  options={BANK_OPTIONS}
                />
                {bankErrors.bankName && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {bankErrors.bankName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Nomor Rekening <span className="text-red-500">*</span>
                </label>
                <Input
                  value={bankForm.bankAccountNumber}
                  onChange={(e) =>
                    handleBankChange("bankAccountNumber", e.target.value)
                  }
                  placeholder="Nomor Rekening"
                  className={`!h-11 !rounded-lg ${bankErrors.bankAccountNumber ? "!border-red-500 focus:!border-red-500 focus:!shadow-[0_0_0_2px_rgba(239,68,68,0.2)]" : ""}`}
                />
                {bankErrors.bankAccountNumber && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {bankErrors.bankAccountNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Nama Pemilik Rekening <span className="text-red-500">*</span>
                </label>
                <Input
                  value={bankForm.bankAccountName}
                  onChange={(e) =>
                    handleBankChange("bankAccountName", e.target.value)
                  }
                  placeholder="Nama sesuai rekening bank"
                  className={`!h-11 !rounded-lg ${bankErrors.bankAccountName ? "!border-red-500 focus:!border-red-500 focus:!shadow-[0_0_0_2px_rgba(239,68,68,0.2)]" : ""}`}
                />
                {bankErrors.bankAccountName && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {bankErrors.bankAccountName}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              loading={loading}
              onClick={handleSaveBank}
              disabled={
                (vendorData?.status === "PENDING" &&
                  !!vendorData?.bankAccountNumber) ||
                (vendorData?.status === "VERIFIED" && !isBankFormChanged())
              }
              className="!h-11 !px-10 !rounded-full !bg-[#7C3AED] border-none shadow-lg shadow-purple-100 !font-bold disabled:!bg-gray-400 disabled:cursor-not-allowed">
              {vendorData?.status === "PENDING" &&
              !!vendorData?.bankAccountNumber
                ? "Menunggu Verifikasi"
                : "Simpan Data Bank"}
            </Button>
          </div>
        </div>
      ),
    });
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan Akun</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola informasi personal dan detail operasional bisnis vendor Anda.
        </p>
      </div>

      {notificationMessage && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 font-semibold">{notificationMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          className="custom-settings-tabs"
          tabBarStyle={{ paddingLeft: "2rem", paddingTop: "1rem" }}
          items={tabItems}
        />
      </div>
    </div>
  );
}
