"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineCalendar,
  HiOutlineBuildingOffice,
  HiClipboard,
  HiArrowRightOnRectangle,
  HiOutlineChartBar,
  HiOutlineHome,
} from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminMenus: { group: string; items: MenuItem[] }[] = [
  {
    group: "Analitik",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: <HiOutlineChartBar size={18} />,
      },
    ],
  },
  {
    group: "Monitoring",
    items: [
      {
        label: "List Vendor",
        href: "/admin/vendors",
        icon: <HiOutlineBuildingOffice size={18} />,
      },
      {
        label: "List User",
        href: "/admin/users",
        icon: <HiOutlineUsers size={18} />,
      },
      {
        label: "List Order",
        href: "/admin/orders",
        icon: <HiClipboard size={18} />,
      },
    ],
  },
];

const vendorMenus: { group: string; items: MenuItem[] }[] = [
  {
    group: "Analitik",
    items: [
      {
        label: "Dashboard",
        href: "/vendor",
        icon: <HiOutlineChartBar size={18} />,
      },
    ],
  },
  {
    group: "Kelola",
    items: [
      {
        label: "Venue Saya",
        href: "/vendor/venues",
        icon: <HiOutlineBuildingOffice size={18} />,
      },
      {
        label: "Booking Masuk",
        href: "/vendor/bookings",
        icon: <HiClipboard size={18} />,
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { clearAuth, initAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    initAuth();

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      if (parsedUser.role === "CUSTOMER") {
        router.push("/");
        return;
      }
      setCurrentUser(parsedUser);
    } catch {
      router.push("/login");
      return;
    }

    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setShowProfileMenu(false);
    router.push("/login");
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest(".profile-dropdown")) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showProfileMenu]);

  if (!mounted || !currentUser) return null;

  const menus = currentUser.role === "ADMIN" ? adminMenus : vendorMenus;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className="w-64 min-h-screen flex flex-col fixed top-0 left-0 z-40"
        style={{
          background: "linear-gradient(180deg, #5B21B6 0%, #7C3AED 100%)",
        }}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-purple-500/30">
          <Link href="/">
            <Image
              src="/LOGO-ARENAKU.svg"
              alt="Arenaku"
              width={120}
              height={40}
              className="brightness-0 invert"
            />
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-y-auto">
          {menus.map((group) => (
            <div key={group.group}>
              <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
                {group.group}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-purple-200 hover:bg-white/10 hover:text-white"
                      }`}>
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom — Lainnya */}
        <div className="px-4 py-6 border-t border-purple-500/30">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
            Lainnya
          </p>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-200 hover:bg-white/10 hover:text-white transition w-full mb-2">
            <HiOutlineHome size={18} />
            Lihat Website
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-200 hover:bg-white/10 hover:text-white transition w-full">
            <HiArrowRightOnRectangle size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end sticky top-0 z-30">
          <div className="relative profile-dropdown">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                }}>
                {currentUser.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {currentUser.name}
                </p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2">
                  <HiArrowRightOnRectangle size={16} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
