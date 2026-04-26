"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { HiOutlineShoppingCart, HiOutlineUser } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, initAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (user.role === "CUSTOMER") {
      api
        .get("/cart")
        .then((res) => setCartCount(res.data.length))
        .catch(() => {});
    }
  }, [mounted, user]);

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
                  <Link
                    href="/cart"
                    className="relative p-2 text-gray-600 hover:text-purple-700 transition">
                    <HiOutlineShoppingCart size={22} />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Link>
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
                            href={
                              user.role === "ADMIN"
                                ? "/dashboard/admin"
                                : "/dashboard/vendor"
                            }
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
