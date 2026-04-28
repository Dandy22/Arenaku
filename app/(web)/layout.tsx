"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  HiOutlineShoppingCart,
  HiOutlineUser,
  HiOutlineTrash,
} from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import { useCartStore } from "@/lib/store/cart.store";
import api from "@/lib/axios";
import { Drawer, message } from "antd";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, initAuth } = useAuthStore();
  const { items: cartItems, removeItem } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, []);

  const cartCount = cartItems.length;

  const handleCartClick = () => {
    if (!user) {
      message.warning("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }
    if (user.role !== "CUSTOMER") {
      message.warning("Hanya customer yang dapat menggunakan keranjang");
      return;
    }
    setCartDrawerOpen(true);
  };

  const handleRemoveFromCart = async (id: string) => {
    try {
      await removeItem(id);
      message.success("Item dihapus");
    } catch {
      message.error("Gagal menghapus item");
    }
  };

  const cartTotal = cartItems.reduce((acc, item) => {
    if (item.fieldId) {
      return acc + (item.field?.price || 0) * (item.endHour - item.startHour);
    }
    if (item.eventId) {
      return acc + (item.event?.ticketPrice || 0) * (item.quantity || 1);
    }
    return acc;
  }, 0);

  const handleLogout = () => {
    clearAuth();
    setDropdownOpen(false);
    router.push("/login");
  };

  const navLinks = [
    { label: "HOME", href: "/" },
    { label: "VENUE", href: "/venues" },
    { label: "ACTIVITY", href: "/activity" },
  ];

  if (!mounted)
    return (
      <div className="min-h-screen">
        <div className="h-16 bg-white border-b border-gray-100" />
        <main>{children}</main>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/LOGO-ARENAKU-PURPLE.svg"
              alt="Arenaku"
              width={120}
              height={36}
            />
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold tracking-wide transition ${
                    isActive
                      ? "text-purple-700"
                      : "text-gray-500 hover:text-gray-800"
                  }`}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-600 hover:text-gray-800 transition">
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                  }}>
                  Daftar
                </Link>
              </>
            ) : (
              <>
                {/* Cart - only for CUSTOMER */}
                {user.role === "CUSTOMER" && (
                  <button
                    onClick={handleCartClick}
                    className="relative p-2 text-gray-600 hover:text-purple-700 transition">
                    <HiOutlineShoppingCart size={22} />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Avatar + dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                    }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </button>

                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-11 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                        {(user.role === "ADMIN" || user.role === "VENDOR") && (
                          <Link
                            href={user.role === "ADMIN" ? "/admin" : "/vendor"}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                            onClick={() => setDropdownOpen(false)}>
                            Dashboard
                          </Link>
                        )}
                        {user.role === "CUSTOMER" && (
                          <Link
                            href="/orders"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                            onClick={() => setDropdownOpen(false)}>
                            Riwayat Pesanan
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full text-left">
                          Keluar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Cart Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <HiOutlineShoppingCart size={20} />
            <span>Keranjang Saya</span>
          </div>
        }
        placement="right"
        onClose={() => setCartDrawerOpen(false)}
        open={cartDrawerOpen}
        size={400}>
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <HiOutlineShoppingCart size={48} className="mb-4 opacity-50" />
            <p>Keranjang Anda kosong</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                  {item.field?.imageUrl ? (
                    <img
                      src={item.field.imageUrl}
                      alt={item.field.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🏟️
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.field?.name || item.event?.title || "Item"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.startHour}:00 - {item.endHour}:00
                  </p>
                  {item.fieldId && (
                    <p className="text-sm font-bold text-purple-600 mt-1">
                      Rp{" "}
                      {(
                        item.field?.price *
                        (item.endHour - item.startHour)
                      )?.toLocaleString("id-ID")}
                    </p>
                  )}
                  {item.eventId && (
                    <p className="text-sm font-bold text-purple-600 mt-1">
                      Rp{" "}
                      {(
                        item.event?.ticketPrice * (item.quantity || 1)
                      )?.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFromCart(item.id)}
                  className="self-start p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                  <HiOutlineTrash size={16} />
                </button>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-700">
                  Total
                </span>
                <span className="text-lg font-bold text-purple-700">
                  Rp {cartTotal.toLocaleString("id-ID")}
                </span>
              </div>
              <button
                onClick={() => {
                  setCartDrawerOpen(false);
                  router.push("/cart");
                }}
                className="w-full py-3 rounded-lg font-semibold text-white text-sm transition"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                }}>
                Lihat Keranjang Lengkap
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Footer */}
      <footer
        style={{
          background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
        }}
        className="relative overflow-hidden">
        <div
          className="absolute bottom-0 right-0 w-64 h-64 opacity-20"
          style={{
            background: "radial-gradient(circle, #EC4899, transparent)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
          <Image
            src="/LOGO-ARENAKU.svg"
            alt="Arenaku"
            width={120}
            height={36}
            className="brightness-0 invert mb-4"
          />
          <p className="text-purple-200 text-sm">
            Booking venue olahraga dengan praktis dalam satu platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
