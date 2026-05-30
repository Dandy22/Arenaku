"use client";

import { useMemo, useEffect, useState } from "react";
import { message, Button } from "antd";
import { HiEye } from "react-icons/hi2";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";
import dayjs from "dayjs";
import DataTable from "@/components/reusable/DataTable";
import CustomDrawer from "@/components/reusable/CustomDrawer";
import { useSearchParams } from "next/navigation";

interface Booking {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  price: number;
  createdAt: string;
  field: { name: string; venue: { name: string } };
  order: {
    id: string;
    status: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    notes?: string;
    payment?: {
      status: string;
      method: string;
      createdAt: string;
    };
  };
}

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    api
      .get("/vendor/bookings")
      .then((res) => {
        const sortedData = res.data.sort(
          (a: Booking, b: Booking) =>
            dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
        );
        setBookings(sortedData);
      })
      .catch(() => message.error("Gagal memuat data booking"))
      .finally(() => setLoading(false));
  }, []);

  // --- BADGE STATUS ---
  const statusBadge = (status: string, isPayment = false) => {
    if (!status && isPayment) {
      return (
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          Belum ada
        </span>
      );
    }

    const map: Record<string, { text: string; className: string }> = {
      PENDING: { text: "Pending", className: "text-yellow-600 bg-yellow-50" },
      PAID: { text: "Lunas", className: "text-green-500 bg-green-50" },
      SUCCESS: { text: "Berhasil", className: "text-green-500 bg-green-50" },
      CANCELLED: { text: "Batal", className: "text-red-500 bg-red-50" },
      FAILED: { text: "Gagal", className: "text-red-500 bg-red-50" },
      EXPIRED: { text: "Expired", className: "text-slate-500 bg-slate-100" },
    };

    const item = map[status?.toUpperCase()] || map.PENDING;

    return (
      <div
        className={`inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        {item.text}
      </div>
    );
  };

  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;
    const query = searchQuery.toLowerCase();
    return bookings.filter((item) => {
      return (
        item.order?.customerName?.toLowerCase().includes(query) ||
        item.order?.id?.toLowerCase().includes(query) ||
        item.field?.name?.toLowerCase().includes(query) ||
        item.field?.venue?.name?.toLowerCase().includes(query)
      );
    });
  }, [bookings, searchQuery]);

  const columns: ColumnsType<Booking> = [
    {
      title: "ID Order",
      key: "orderId",
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500 uppercase">
          #{r.order?.id?.slice(-6) || "-"}
        </span>
      ),
    },
    {
      title: "Customer",
      key: "customerName",
      render: (_, r) => (
        <span className="font-semibold text-sm text-slate-500">
          {r.order?.customerName}
        </span>
      ),
    },
    {
      title: "Lapangan",
      key: "field",
      render: (_, r) => (
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {r.field?.name}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {r.field?.venue?.name}
          </p>
        </div>
      ),
    },
    {
      title: "Jadwal Main",
      key: "schedule",
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (_, r) => {
        const start = String(r.startHour).padStart(2, "0");
        const end = String(r.endHour).padStart(2, "0");
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-500">
              {dayjs(r.date).format("DD/MM/YY")}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {start}:00 - {end}:00 WIB
            </span>
          </div>
        );
      },
    },
    {
      title: "Total",
      dataIndex: "price",
      key: "price",
      align: "right",
      sorter: (a, b) => a.price - b.price,
      render: (price) => (
        <span className="font-semibold text-sm text-slate-500">
          Rp {price?.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Status",
      key: "orderStatus",
      align: "center",
      render: (_, r) => statusBadge(r.order?.status),
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "left",
      render: (_, record) => (
        <Button
          onClick={() => {
            setSelectedBooking(record);
            setDrawerOpen(true);
          }}
          icon={<HiEye size={18} />}
          className="!h-9 !rounded-full !border-[#F1F5F9] !px-4 !text-blue-500 !font-semibold !shadow-none hover:!bg-blue-50 cursor-pointer">
          Detail
        </Button>
      ),
    },
  ];

  // --- DRAWER CONTENT (KONSISTEN DENGAN ARENAKU DESIGNS) ---
  const renderDrawerContent = () => {
    if (!selectedBooking) return null;

    return (
      <div className="space-y-6 mt-2 pb-6">
        {/* --- 1. INFO CUSTOMER --- */}
        <div>
          <p className="text-sm font-bold text-slate-700 mb-3">
            Informasi Pemesan
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Nama Pemesan
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {selectedBooking.order?.customerName}
                </p>
              </div>
            </div>

            {/* Dipisah No. Telepon dan Email ke baris baru */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">
                No. Telepon
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {selectedBooking.order?.customerPhone}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Email</p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200 overflow-hidden">
                <p className="font-semibold text-sm text-slate-600 truncate">
                  {selectedBooking.order?.customerEmail}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. DETAIL LAPANGAN & WAKTU --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Jadwal Lapangan
          </p>
          <div className="space-y-4">
            {/* Dipisah Venue dan Lapangan ke baris baru */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Venue</p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {selectedBooking.field?.venue?.name}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Lapangan
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {selectedBooking.field?.name}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Tanggal Main
                </p>
                <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                  <p className="font-semibold text-sm text-slate-600">
                    {dayjs(selectedBooking.date).format("DD MMM YYYY")}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 mb-1">Jam</p>
                <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                  <p className="font-semibold text-sm text-slate-600">
                    {String(selectedBooking.startHour).padStart(2, "0")}:00 -{" "}
                    {String(selectedBooking.endHour).padStart(2, "0")}:00 WIB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- 3. CATATAN PENGGUNA --- */}
        {selectedBooking.order?.notes && (
          <div className="pt-4 border-t border-gray-100 mt-6 animate-in fade-in">
            <p className="text-sm font-bold text-slate-700 mb-3">
              Catatan Khusus
            </p>
            <div className="!rounded-xl !p-4 bg-slate-50 border border-slate-200">
              <p className="font-medium text-sm text-slate-600 italic">
                "{selectedBooking.order.notes}"
              </p>
            </div>
          </div>
        )}

        {/* --- 4. INFO PEMBAYARAN --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Informasi Pembayaran
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Metode
                </p>
                <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200 flex items-center min-h-[46px]">
                  <p className="font-semibold text-slate-600 text-sm uppercase">
                    {selectedBooking.order?.payment?.method?.replace(
                      /_/g,
                      " ",
                    ) || "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Status Order
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200 flex items-center min-h-[46px]">
                {statusBadge(selectedBooking.order?.status)}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center mt-2">
              <span className="text-sm font-bold text-blue-800">
                Total Dibayar
              </span>
              <span className="text-lg font-black text-blue-600">
                Rp {selectedBooking.price?.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Booking Masuk</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor semua pemesanan lapangan, jadwal, dan catatan khusus dari
            pelanggan.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <DataTable
            columns={columns}
            dataSource={filteredBookings}
            isLoading={loading}
            showSearch
            searchPlaceholder="Cari nama customer, ID order, atau lapangan..."
          />
        </div>
      </div>

      <CustomDrawer
        title={
          <span className="text-xl font-bold text-slate-800">
            Detail Booking
          </span>
        }
        open={drawerOpen}
        setOpen={setDrawerOpen}
        content={renderDrawerContent()}
        footer={
          <Button
            onClick={() => setDrawerOpen(false)}
            className="w-full !h-11 !rounded-lg !border-gray-300 hover:!bg-gray-50 !text-slate-600 !font-semibold !text-sm cursor-pointer">
            Tutup Detail
          </Button>
        }
      />
    </>
  );
}
