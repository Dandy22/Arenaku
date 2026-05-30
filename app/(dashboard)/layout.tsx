"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  HiOutlineUsers,
  HiUsers,
  HiOutlineCalendar,
  HiCalendar,
  HiOutlineBuildingOffice,
  HiBuildingOffice,
  HiOutlineChartBar,
  HiChartBar,
  HiClipboard,
  HiOutlineHome,
  HiChevronLeft,
  HiChevronDown,
  HiArrowRightOnRectangle,
  HiOutlineClipboard,
  HiOutlineUserCircle,
  HiUserCircle,
  HiOutlineBell,
  HiBell,
  HiOutlineXMark,
  HiCheck,
  HiOutlineEnvelope,
  HiOutlineTrash,
  HiOutlineBanknotes,
  HiBanknotes,
} from "react-icons/hi2";

import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  data?: any;
}

const adminMenus: { group: string; items: MenuItem[] }[] = [
  {
    group: "Analitik",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: <HiOutlineChartBar size={18} />,
        activeIcon: <HiChartBar size={18} />,
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
        activeIcon: <HiBuildingOffice size={18} />,
      },
      {
        label: "List User",
        href: "/admin/users",
        icon: <HiOutlineUsers size={18} />,
        activeIcon: <HiUsers size={18} />,
      },
      {
        label: "List Order",
        href: "/admin/orders",
        icon: <HiOutlineClipboard size={18} />,
        activeIcon: <HiClipboard size={18} />,
      },
      {
        label: "Penarikan Dana",
        href: "/admin/withdrawals",
        icon: <HiOutlineBanknotes size={18} />,
        activeIcon: <HiBanknotes size={18} />,
      },
      {
        label: "Kelola Event",
        href: "/admin/events",
        icon: <HiOutlineCalendar size={18} />,
        activeIcon: <HiCalendar size={18} />,
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
        activeIcon: <HiChartBar size={18} />,
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
        activeIcon: <HiBuildingOffice size={18} />,
      },
      {
        label: "Booking Masuk",
        href: "/vendor/bookings",
        icon: <HiOutlineClipboard size={18} />,
        activeIcon: <HiClipboard size={18} />,
      },
      {
        label: "Event Saya",
        href: "/vendor/events",
        icon: <HiOutlineCalendar size={18} />,
        activeIcon: <HiCalendar size={18} />,
      },
    ],
  },
  {
    group: "Pengaturan",
    items: [
      {
        label: "Profil",
        href: "/vendor/accounts/profile",
        icon: <HiOutlineUserCircle size={18} />,
        activeIcon: <HiUserCircle size={18} />,
      },
      {
        label: "Keuangan",
        href: "/vendor/accounts/finance",
        icon: <HiOutlineBanknotes size={18} />,
        activeIcon: <HiBanknotes size={18} />,
      },
      {
        label: "Kelola Pengguna",
        href: "/vendor/accounts/users",
        icon: <HiOutlineUsers size={18} />,
        activeIcon: <HiUsers size={18} />,
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

  // VENDOR ROLE STATE
  const [vendorRole, setVendorRole] = useState<"OWNER" | "STAFF" | null>(null);

  // STATE DROPDOWN
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // REAL NOTIFICATIONS FROM API
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);

  // Fetch notifications dari API (Fungsi yang sebelumnya hilang)
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotif(true);
      const response = await api.get("/notifications?limit=20");
      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotif(false);
    }
  }, []);

  // Fetch vendor role for current user
  const fetchVendorRole = useCallback(async () => {
    try {
      const response = await api.get("/vendor/profile");
      if (response.data?.vendorRole) {
        setVendorRole(response.data.vendorRole);
      }
    } catch (error) {
      console.error("Error fetching vendor role:", error);
    }
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (notifId: string) => {
    try {
      await api.post("/notifications", {
        action: "read",
        notificationIds: [notifId],
      });
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications", {
        action: "read-all",
      });
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete all notifications
  const handleDeleteAllNotifications = async () => {
    try {
      await api.delete("/notifications");
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} mnt`;
    if (diffHours < 24) return `${diffHours} jam`;
    if (diffDays < 7) return `${diffDays} hari`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

      fetchNotifications();

      if (parsedUser.role === "VENDOR") {
        // 🔥 AUTO-KICK LOGIC: Fetch status real-time dari database
        api
          .get("/vendor/profile")
          .then((res) => {
            const realUser = res.data.user;

            // Jika backend memvonis dia sudah jadi CUSTOMER (akibat di-kick/dihapus)
            if (realUser && realUser.role === "CUSTOMER") {
              // 1. Update localStorage dengan data terbaru
              localStorage.setItem("user", JSON.stringify(realUser));
              // 2. Tampilkan pesan
              alert(
                "Akses Vendor Anda telah dicabut. Anda akan dialihkan ke halaman utama.",
              );
              // 3. Refresh & tendang ke beranda
              window.location.href = "/";
              return;
            }

            // Jika masih VENDOR beneran, simpan role owner/staff-nya
            if (res.data.vendorRole) {
              setVendorRole(res.data.vendorRole);
            }
          })
          .catch((error) => {
            console.error("Gagal memverifikasi status vendor", error);
          });
      }
    } catch {
      router.push("/login");
      return;
    }

    setMounted(true);
  }, [fetchNotifications, initAuth, router]);

  const handleLogout = () => {
    clearAuth();
    setShowProfileMenu(false);
    router.push("/login");
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifMenu(false); // Tutup notif kalau buka profile
  };

  const handleNotifClick = () => {
    setShowNotifMenu(!showNotifMenu);
    setShowProfileMenu(false);
    // Fetch notifications when opening the menu
    if (!showNotifMenu) {
      fetchNotifications();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest(".profile-dropdown")) {
        setShowProfileMenu(false);
      }
      if (showNotifMenu && !target.closest(".notif-dropdown")) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showProfileMenu, showNotifMenu]);

  if (!mounted || !currentUser) return null;
  const menus = currentUser.role === "ADMIN" ? adminMenus : vendorMenus;
  return (
    <div className="min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } min-h-screen flex flex-col fixed top-0 left-0 z-40 transition-all duration-300`}
        style={{
          background: "linear-gradient(180deg, #5B21B6 0%, #7C3AED 100%)",
        }}>
        {/* LOGO - Dibuat center saat sidebar kecil */}
        <div
          className={`px-6 py-6 border-b border-purple-500/30 flex ${isSidebarOpen ? "justify-start" : "justify-center"}`}>
          <Link href="/">
            {isSidebarOpen ? (
              <Image
                src="/LOGO-ARENAKU.svg"
                alt="Arenaku"
                width={120}
                height={40}
                className="brightness-0 invert"
              />
            ) : (
              <div className="flex items-center justify-center">
                <Image
                  src="/LOGO-ARENAKU-A.svg"
                  alt="Arenaku"
                  width={32}
                  height={32}
                  className="brightness-0 invert"
                />
              </div>
            )}
          </Link>
        </div>

        {/* BUTTON TOGGLE SIDEBAR */}
        <div
          className={`absolute -right-4 top-24 rounded-2xl transition ${isSidebarOpen ? "" : "rotate-180"}`}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center cursor-pointer text-white shadow-lg">
            <HiChevronLeft size={18} />
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-hidden">
          {menus.map((group) => (
            <div key={group.group} className="flex flex-col">
              {isSidebarOpen ? (
                <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
                  {group.group}
                </p>
              ) : (
                <div className="h-[1px] bg-purple-500/30 mb-4 mx-2" />
              )}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                        isSidebarOpen
                          ? "gap-3 px-3 py-2.5 justify-start"
                          : "justify-center py-2.5 px-0"
                      } ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-purple-200 hover:bg-white/10 hover:text-white"
                      }`}
                      title={!isSidebarOpen ? item.label : ""}>
                      {isActive ? item.activeIcon : item.icon}
                      {isSidebarOpen && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* LAINNYA */}
        <div className="px-4 py-6 border-t border-purple-500/30 flex flex-col gap-1">
          {isSidebarOpen && (
            <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
              Lainnya
            </p>
          )}

          <Link
            href="/"
            className={`flex items-center rounded-lg text-sm font-medium text-purple-200 hover:bg-white/10 hover:text-white transition w-full ${
              isSidebarOpen
                ? "gap-3 justify-start px-3 py-2.5"
                : "justify-center py-2.5 px-0"
            }`}
            title={!isSidebarOpen ? "Lihat Website" : ""}>
            <HiOutlineHome size={18} />
            {isSidebarOpen && <span>Lihat Website</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`flex items-center rounded-lg text-sm font-medium text-purple-200 hover:bg-white/10 hover:text-white transition w-full ${
              isSidebarOpen
                ? "gap-3 justify-start px-3 py-2.5"
                : "justify-center py-2.5 px-0"
            }`}
            title={!isSidebarOpen ? "Keluar" : ""}>
            <HiArrowRightOnRectangle size={18} />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? "16rem" : "5rem", // 64px & 20px
        }}>
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 h-16 flex items-center justify-end sticky top-0 z-50">
          <div className="flex items-center gap-4">
            {/* --- NOTIFIKASI DROPDOWN --- */}
            <div className="relative notif-dropdown ">
              <button
                onClick={handleNotifClick}
                className="relative p-2 text-gray-500 cursor-pointer hover:text-purple-600 transition"
                title="Notifikasi">
                {unreadCount > 0 ? (
                  <>
                    <HiBell size={24} className="text-purple-600" />
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#A855F7] text-white text-[10px] flex items-center justify-center font-bold border-2 border-white box-content">
                      {unreadCount}
                    </span>
                  </>
                ) : (
                  <HiOutlineBell size={24} />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-3 w-[360px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col z-[60] origin-top-right animate-in fade-in zoom-in duration-200">
                  {/* Arrow Pointing Up */}
                  <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45 z-0"></div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-dashed border-gray-200 relative z-10 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[17px] font-bold text-[#334155]">
                        Notifikasi
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-[#F3E8FF] text-[#9333EA] text-sm font-bold px-2 py-0.5 rounded-md">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-md cursor-pointer hover:bg-gray-100 transition">
                      <HiOutlineXMark size={22} />
                    </button>
                  </div>

                  {/* List Notifikasi */}
                  <div className="max-h-[340px] overflow-y-auto p-3 space-y-2 relative z-10 bg-white">
                    {loadingNotif ? (
                      <div className="py-8 text-center text-sm text-slate-500 font-medium">
                        Memuat notifikasi...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-500 font-medium">
                        Belum ada notifikasi baru.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() =>
                            !notif.isRead && handleMarkAsRead(notif.id)
                          }
                          className={`flex gap-3 p-3.5 rounded-xl transition cursor-pointer hover:bg-gray-50 border border-transparent ${
                            !notif.isRead ? "bg-slate-50" : "bg-white"
                          }`}>
                          {/* Icon Avatar */}
                          <div className="w-11 h-11 rounded-full bg-[#E2E8F0] flex items-center justify-center shrink-0">
                            <HiOutlineEnvelope
                              className="text-[#64748B]"
                              size={22}
                            />
                          </div>

                          {/* Text Content */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-sm font-semibold text-[#64748B] break-words pr-2">
                                {notif.title}
                              </p>
                              {!notif.isRead && (
                                <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-[#A855F7] shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm font-bold text-[#334155] break-words mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              <p className="text-[13px] font-semibold text-[#94A3B8]">
                                {formatRelativeTime(notif.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-dashed border-gray-200 relative z-10 bg-white rounded-b-2xl flex justify-between items-center">
                    <button
                      onClick={handleDeleteAllNotifications}
                      className="flex items-center cursor-pointer gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition px-2 py-1 rounded-md hover:bg-red-50">
                      <HiOutlineTrash size={18} />
                      Hapus Semua
                    </button>
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center cursor-pointer gap-1.5 text-sm font-semibold text-[#A855F7] hover:text-[#9333EA] transition px-2 py-1 rounded-md hover:bg-purple-50">
                      <div className="flex -space-x-1.5">
                        <HiCheck size={18} />
                        <HiCheck size={18} />
                      </div>
                      Tandai semua dibaca
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* GARIS PEMISAH */}
            <div className="w-[1px] h-8 bg-slate-200 rounded-full hidden sm:block"></div>

            {/* --- PROFILE DROPDOWN --- */}
            <div className="relative profile-dropdown">
              <button
                onClick={handleProfileClick}
                className={`flex items-center gap-3 p-1.5 rounded-xl transition-all duration-200 ${
                  showProfileMenu ? "bg-gray-100" : "hover:bg-gray-50"
                }`}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                  }}>
                  {currentUser.name?.charAt(0).toUpperCase()}
                </div>

                <div className="text-left hidden sm:block cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-800 leading-none">
                      {currentUser.name}
                    </p>
                    <div
                      className={`transition-transform duration-200 ${
                        showProfileMenu ? "rotate-180" : ""
                      }`}>
                      <HiChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-0.5">
                    {currentUser.role}
                  </p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-[60] origin-top-right animate-in fade-in zoom-in duration-200">
                  {/* 🔺 Arrow */}
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45"></div>

                  <div className="relative z-10 py-2">
                    <div className="px-4 py-3 mb-1 border-b border-gray-50">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                        Akun Saya
                      </p>
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="px-2 space-y-1">
                      {currentUser.role !== "ADMIN" && (
                        <button
                          onClick={() => {
                            router.push("/vendor/accounts/profile");
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm text-gray-700 font-semibold hover:bg-gray-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors text-purple-600">
                            <HiOutlineUserCircle size={18} />
                          </div>
                          Pengaturan Akun
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2.5 text-sm text-red-600 font-semibold hover:bg-red-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                          <HiArrowRightOnRectangle size={18} />
                        </div>
                        Keluar Aplikasi
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
