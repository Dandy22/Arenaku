"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiOutlineBell,
  HiBell,
  HiOutlineXMark,
  HiCheck,
  HiOutlineEnvelope,
  HiChevronDown,
  HiArrowRightOnRectangle,
  HiOutlineUserCircle,
  HiOutlineBars3,
} from "react-icons/hi2";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import { useCartStore } from "@/lib/store/cart.store";
import api from "@/lib/axios";
import { Drawer, message } from "antd";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  data?: any;
}

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, initAuth, isInitialized } = useAuthStore();
  const { items: cartItems, removeItem } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // STATE NOTIFIKASI
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, [initAuth]);

  // Fetch Notifikasi
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  // Load notifikasi saat user tersedia dan auth sudah diinisialisasi
  useEffect(() => {
    if (isInitialized && user) {
      fetchNotifications();
    }
  }, [user, isInitialized, fetchNotifications]);

  // Mark single notification as read
  const handleMarkAsRead = async (notifId: string) => {
    try {
      await api.post("/notifications", {
        action: "read",
        notificationIds: [notifId],
      });
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
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  // FORMAT TIME
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

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }

    if (notif.type === "VENDOR_INVITE" && user?.role === "CUSTOMER") {
      const updatedUser = { ...user, role: "VENDOR" as "VENDOR" };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });

      message.success("Berhasil bergabung! Mengalihkan ke dashboard...");
      setTimeout(() => {
        window.location.href = notif.data?.actionUrl || "/vendor";
      }, 800);
    } else {
      if (notif.data?.actionUrl) {
        router.push(notif.data.actionUrl);
      } else {
        console.warn("Notifikasi ini tidak memiliki link tujuan.");
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownOpen && !target.closest(".profile-dropdown")) {
        setDropdownOpen(false);
      }
      if (showNotifMenu && !target.closest(".notif-dropdown")) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen, showNotifMenu]);

  // CART LOGIC
  const cartCount = cartItems.length;
  const cartTotal = cartItems.reduce((acc, item) => {
    if (item.fieldId) {
      return acc + (item.field?.price || 0) * (item.endHour - item.startHour);
    }
    if (item.eventId) {
      const ticketPrice = item.ticketPrice ?? item.event?.ticketPrice ?? 0;
      return acc + ticketPrice * (item.quantity || 1);
    }
    return acc;
  }, 0);

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
          <Link href="/">
            <Image
              src="/LOGO-ARENAKU-PURPLE.svg"
              alt="Arenaku"
              width={120}
              height={36}
            />
          </Link>

          {/* Desktop Navigation - Centered */}
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
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-800"
                  }`}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <div className="flex items-center gap-3">
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
              </div>
            ) : (
              <>
                {user.role === "CUSTOMER" && (
                  <button
                    onClick={handleCartClick}
                    className="relative p-2 text-gray-500 hover:text-primary transition cursor-pointer"
                    title="Keranjang">
                    <HiOutlineShoppingCart size={24} />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-0 w-4 h-4 cursor-pointer rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold border-2 border-white box-content">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Notification Dropdown */}
                <div className="relative notif-dropdown flex items-center">
                  <button
                    onClick={() => {
                      setShowNotifMenu(!showNotifMenu);
                      setDropdownOpen(false);
                      if (!showNotifMenu) fetchNotifications();
                    }}
                    className="relative p-2 text-gray-500 cursor-pointer hover:text-primary transition"
                    title="Notifikasi">
                    {unreadCount > 0 ? (
                      <>
                        <HiBell size={24} className="text-primary" />
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#A855F7] text-white text-[10px] flex items-center justify-center font-bold border-2 border-white box-content">
                          {unreadCount}
                        </span>
                      </>
                    ) : (
                      <HiOutlineBell size={24} />
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 top-12 w-[360px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col z-[60] origin-top-right animate-in fade-in zoom-in duration-200">
                      <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45 z-0"></div>

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
                              onClick={() => handleNotificationClick(notif)}
                              className={`flex gap-3 p-3.5 rounded-xl transition cursor-pointer hover:bg-gray-50 border border-transparent ${
                                !notif.isRead ? "bg-slate-50" : "bg-white"
                              }`}>
                              <div className="w-11 h-11 rounded-full bg-[#E2E8F0] flex items-center justify-center shrink-0">
                                <HiOutlineEnvelope
                                  className="text-[#64748B]"
                                  size={22}
                                />
                              </div>

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

                {/* Avatar Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      setShowNotifMenu(false);
                    }}
                    className={`flex items-center gap-3 p-1.5 rounded-xl transition-all duration-200 ${
                      dropdownOpen ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                      }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="text-left hidden sm:block cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-gray-800 leading-none">
                          {user.name}
                        </p>
                        <div
                          className={`transition-transform duration-200 ${
                            dropdownOpen ? "rotate-180" : ""
                          }`}>
                          <HiChevronDown size={14} className="text-gray-400" />
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mt-0.5">
                        {user.role}
                      </p>
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-[60] origin-top-right animate-in fade-in zoom-in duration-200">
                      <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45"></div>

                      <div className="relative z-10 py-2">
                        <div className="px-4 py-3 mb-1 border-b border-gray-50">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                            Akun Saya
                          </p>
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>

                        <div className="px-2 space-y-1">
                          {(user.role === "ADMIN" ||
                            user.role === "VENDOR") && (
                            <button
                              onClick={() => {
                                setDropdownOpen(false);
                                router.push(
                                  user.role === "ADMIN" ? "/admin" : "/vendor",
                                );
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm text-gray-700 font-semibold hover:bg-gray-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 group">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors text-purple-600">
                                <HiOutlineUserCircle size={18} />
                              </div>
                              Dashboard
                            </button>
                          )}

                          {user.role === "CUSTOMER" && (
                            <button
                              onClick={() => {
                                setDropdownOpen(false);
                                router.push("/orders");
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm text-gray-700 font-semibold hover:bg-gray-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 group">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors text-blue-600">
                                <HiClipboardDocumentList size={18} />
                              </div>
                              Riwayat Pesanan
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

                {/* Mobile Hamburger Menu */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-500 hover:text-primary transition"
                  title="Menu">
                  <HiOutlineBars3 size={24} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-semibold tracking-wide transition py-2 px-3 rounded-lg ${
                      isActive
                        ? "text-primary bg-purple-50"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      {/* Cart Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <HiOutlineShoppingCart size={20} />
            <span className="font-semibold">Keranjang Saya</span>
          </div>
        }
        placement="right"
        onClose={() => setCartDrawerOpen(false)}
        open={cartDrawerOpen}
        size={400}>
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <HiOutlineShoppingCart size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-sm">Keranjang Anda kosong</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 ">
                {/* Header (Nama Venue / Event + Delete Button) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 uppercase text-[13px] tracking-wide truncate pr-2">
                    {item.field?.venue?.name ||
                      item.event?.title ||
                      item.field?.name ||
                      "Booking"}
                  </h3>
                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 transition cursor-pointer shrink-0">
                    <HiOutlineTrash size={14} />
                    Hapus
                  </button>
                </div>

                {/* Grid Content 2x2 */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 pt-3">
                  {/* Kolom Kiri Atas */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      {item.fieldId ? "Nama Lapangan" : "Kategori Tiket"}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.field?.name ||
                        item.ticketTier?.name ||
                        item.event?.title ||
                        "Item"}
                    </p>
                  </div>

                  {/* Kolom Kanan Atas */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Tanggal</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(item.date)
                        .toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        .replace(/ /g, "-")}
                    </p>
                  </div>

                  {/* Kolom Kiri Bawah */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      {item.fieldId ? "Jam" : "Kuantitas"}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.fieldId
                        ? `${item.startHour}:00 - ${item.endHour}:00`
                        : `${item.quantity || 1} Tiket`}
                    </p>
                  </div>

                  {/* Kolom Kanan Bawah */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Subtotal</p>
                    <p className="text-sm font-semibold text-slate-800">
                      Rp.{" "}
                      {(item.fieldId
                        ? (item.field?.price || 0) *
                          (item.endHour - item.startHour)
                        : (item.ticketPrice ?? item.event?.ticketPrice ?? 0) *
                          (item.quantity || 1)
                      )?.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t border-slate-200 pt-4 mt-2">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-700">
                  Total
                </span>
                <span className="text-lg font-bold text-primary">
                  Rp {cartTotal.toLocaleString("id-ID")}
                </span>
              </div>
              <button
                onClick={() => {
                  setCartDrawerOpen(false);
                  router.push("/cart");
                }}
                className="w-full py-3 rounded-lg font-semibold text-white text-sm transition cursor-pointer bg-primary hover:bg-purple-600">
                Lihat Keranjang Lengkap
              </button>
            </div>
          </div>
        )}
      </Drawer>

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
        <div className="max-w-7xl h-40 mx-auto px-6 py-10 relative z-10">
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
          <img
            alt="circle"
            src="/circle.svg"
            className="absolute -top-65 -right-120  max-w-[500px] opacity-60 group-hover:scale-105 pointer-events-none select-none"
          />
        </div>
      </footer>
    </div>
  );
}
