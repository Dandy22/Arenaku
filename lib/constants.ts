// ============================================================
// lib/constants.ts
// ------------------------------------------------------------
// Konstanta untuk aplikasi booking-venue
// ============================================================

// 12 Kecamatan di Kota Bekasi
export const BEKASI_DISTRICTS = [
  { label: "Semua Kecamatan", value: "" },
  { label: "Medan Satria", value: "Medan Satria" },
  { label: "Bekasi Utara", value: "Bekasi Utara" },
  { label: "Bekasi Timur", value: "Bekasi Timur" },
  { label: "Rawalumbu", value: "Rawalumbu" },
  { label: "Mustikajaya", value: "Mustikajaya" },
  { label: "Bantargebang", value: "Bantargebang" },
  { label: "Bekasi Barat", value: "Bekasi Barat" },
  { label: "Bekasi Selatan", value: "Bekasi Selatan" },
  { label: "Jatiasih", value: "Jatiasih" },
  { label: "Pondokmelati", value: "Pondokmelati" },
  { label: "Jatisampurna", value: "Jatisampurna" },
  { label: "Pondokgede", value: "Pondokgede" },
] as const;

// Kota Bekasi (untuk backward compatibility)
export const BEKASI_CITY = "Kota Bekasi";

export type BekasiDistrict = typeof BEKASI_DISTRICTS[number]["value"];

// Event Categories
export const EVENT_CATEGORIES = [
  { label: "Semua Kategori", value: "", icon: "🏅" },
  { label: "Futsal", value: "FUTSAL", icon: "⚽" },
  { label: "Badminton", value: "BADMINTON", icon: "🏸" },
  { label: "Mini Soccer", value: "MINI_SOCCER", icon: "⚽" },
  { label: "Basketball", value: "BASKETBALL", icon: "🏀" },
  { label: "Tennis", value: "TENNIS", icon: "🎾" },
  { label: "Volleyball", value: "VOLLEYBALL", icon: "🏐" },
  { label: "Padel", value: "PADEL", icon: "🎾" },
  { label: "Sepak Bola", value: "SOCCER", icon: "🥅" },
  { label: "Lainnya", value: "OTHER", icon: "🏅" },
] as const;

// Sport Types untuk venue
export const SPORT_TYPES = [
  { label: "Semua", value: "" },
  { label: "Futsal", value: "FUTSAL" },
  { label: "Badminton", value: "BADMINTON" },
  { label: "Mini Soccer", value: "MINI_SOCCER" },
  { label: "Basketball", value: "BASKETBALL" },
  { label: "Tennis", value: "TENNIS" },
  { label: "Volleyball", value: "VOLLEYBALL" },
  { label: "Padel", value: "PADEL" },
] as const;