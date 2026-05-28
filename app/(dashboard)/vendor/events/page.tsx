"use client";

import { useEffect, useState } from "react";
import { Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlinePencilSquare,
} from "react-icons/hi2";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import dayjs from "dayjs";

// Reusable Components
import DeleteModal from "@/components/reusable/DeleteModal";
import DataTable from "@/components/reusable/DataTable";
import CustomDrawer from "@/components/reusable/CustomDrawer";
import CustomModal from "@/components/reusable/CustomModal";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  district: string;
  category: string;
  topic?: string;
  date: string;
  endDate?: string;
  startHour: number;
  endHour: number;
  ticketPrice: number;
  status: "ACTIVE" | "CANCELLED" | "COMPLETED" | "DRAFT";
  participants: any[];
  imageUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export default function VendorEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // DRAWER STATE
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // State untuk CustomModal (Batalkan & Selesaikan Event)
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    action: "CANCELLED" | "COMPLETED" | null;
    eventId: string | null;
    eventTitle: string;
  }>({
    open: false,
    action: null,
    eventId: null,
    eventTitle: "",
  });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({
    open: false,
    eventId: null,
    eventTitle: "",
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vendor/events");
      const data = res.data || [];
      const uniqueEvents = Array.from(
        new Map(data.map((item: any) => [item.id, item])).values(),
      );
      setEvents(uniqueEvents as Event[]);
    } catch {
      message.error("Gagal memuat daftar event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/events/${id}`);
      message.success("Draft berhasil dihapus");
      fetchEvents();
    } catch (err: any) {
      message.error("Gagal menghapus data");
    }
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: "COMPLETED" | "CANCELLED",
  ) => {
    try {
      await api.patch(`/events/${id}`, { status: newStatus });
      message.success(
        `Event berhasil ${
          newStatus === "COMPLETED" ? "diselesaikan" : "dibatalkan"
        }`,
      );
      setDrawerOpen(false);
      fetchEvents();
    } catch (err: any) {
      message.error("Gagal memperbarui status event");
    }
  };

  const statusBadge = (status: string) => {
    const map: any = {
      ACTIVE: { text: "Aktif", className: "text-green-500 bg-green-50" },
      COMPLETED: { text: "Selesai", className: "text-blue-500 bg-blue-50" },
      CANCELLED: { text: "Dibatalkan", className: "text-red-500 bg-red-50" },
      DRAFT: { text: "Draft", className: "text-slate-500 bg-slate-100" },
    };
    const item = map[status] || map.DRAFT;
    return (
      <div
        className={`inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        {item.text}
      </div>
    );
  };

  const formatCategory = (cat: string) => {
    if (!cat) return "-";
    if (cat === "TOURNAMENT") return "Turnamen";
    if (cat === "SPORTS") return "Olahraga Rutin";
    return cat;
  };

  const formatDistrict = (district: string) => {
    if (!district) return "-";
    return district
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const columns: ColumnsType<Event> = [
    {
      title: "Judul Event",
      key: "title",
      render: (_, r) => (
        <span className="font-semibold text-slate-600 text-sm">{r.title}</span>
      ),
    },
    {
      title: "Kategori",
      dataIndex: "category",
      key: "category",
      render: (cat) => (
        <span className="text-sm font-semibold text-slate-500">
          {formatCategory(cat)}
        </span>
      ),
    },
    {
      title: "Alamat",
      dataIndex: "location",
      key: "location",
      render: (loc) => (
        <span className="text-sm text-slate-500 font-semibold line-clamp-1 max-w-[200px]">
          {loc || "-"}
        </span>
      ),
    },
    {
      title: "Tanggal Pelaksanaan",
      dataIndex: "date",
      key: "date",
      render: (_, r) => {
        // 1. Validasi data awal (fallback jika kosong total)
        const hasDate = r.date && String(r.date) !== "-";
        if (!hasDate) return <span className="text-slate-400">-</span>;

        // 2. Cek keberadaan tanggal selesai
        const hasEndDate = r.endDate && String(r.endDate) !== "-";

        // 3. Formatting
        const start = dayjs(r.date).format("DD MMM");
        const end = hasEndDate
          ? dayjs(r.endDate).format("DD MMM YYYY")
          : dayjs(r.date).format("DD MMM YYYY");

        return (
          <span className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            {hasEndDate ? (
              <>
                {start}
                <svg
                  viewBox="64 64 896 896"
                  width="12px"
                  height="12px"
                  fill="currentColor"
                  className="text-slate-400">
                  <path d="M873.1 596.2l-164-208A32 32 0 00684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z" />
                </svg>
                {end}
              </>
            ) : (
              end
            )}
          </span>
        );
      },
    },
    {
      title: "Waktu",
      key: "time",
      render: (_, record) => {
        const start = String(record.startHour || 0).padStart(2, "0");
        const end = String(record.endHour || 0).padStart(2, "0");

        return (
          <span className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            {start}:00
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              width="12px"
              height="12px"
              fill="currentColor"
              className="text-slate-300">
              <path d="M873.1 596.2l-164-208A32 32 0 00684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z" />
            </svg>
            {end}:00
          </span>
        );
      },
    },
    {
      title: "Peserta",
      key: "participants",
      align: "center",
      render: (_, r) => (
        <span className="font-semibold text-sm text-slate-500">
          {r.participants?.length || 0}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => statusBadge(r.status),
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "left",
      width: 280,
      render: (_, r) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              setSelectedEvent(r);
              setDrawerOpen(true);
            }}
            icon={<HiOutlineEye className="text-[18px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-blue-500 hover:!bg-blue-50 hover:!border-blue-200 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center !font-semibold">
            Detail
          </Button>
          <Button
            onClick={() => router.push(`/vendor/events/${r.id}`)}
            icon={<HiOutlinePencilSquare className="text-[18px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-[#7C3AED] hover:!bg-purple-50 hover:!border-purple-200 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center !font-semibold">
            Edit
          </Button>
          <Button
            danger
            onClick={() =>
              setDeleteModal({ open: true, eventId: r.id, eventTitle: r.title })
            }
            icon={<HiOutlineTrash className="text-[18px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-red-500 hover:!bg-red-50 hover:!border-red-200 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center !font-semibold">
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const renderDrawerFooter = () => {
    if (!selectedEvent) return null;

    const isDraft = selectedEvent.status === "DRAFT";
    const isActive = selectedEvent.status === "ACTIVE";

    return (
      <div className="flex items-center gap-3 w-full">
        {isDraft && (
          <>
            <Button
              onClick={() => {
                setDeleteModal({
                  open: true,
                  eventId: selectedEvent.id,
                  eventTitle: selectedEvent.title || "Draft Event",
                });
                setDrawerOpen(false);
              }}
              className="flex-1 !h-11 !rounded-lg !border-red-200 !bg-red-50 !text-red-500 !font-semibold !text-sm">
              Batalkan Draft
            </Button>
            <Button
              onClick={() => router.push(`/vendor/events/${selectedEvent.id}`)}
              className="flex-1 !h-11 !text-white !rounded-lg !bg-blue-600 hover:!bg-blue-700 !font-bold text-sm !shadow-none !border-none">
              Lanjutkan Draft
            </Button>
          </>
        )}

        {isActive && (
          <>
            <Button
              onClick={() =>
                setActionModal({
                  open: true,
                  action: "CANCELLED",
                  eventId: selectedEvent.id,
                  eventTitle: selectedEvent.title,
                })
              }
              className="flex-1 !h-11 !rounded-lg !border-gray-300 hover:!bg-gray-50 !text-slate-600 !font-semibold !text-sm">
              Batalkan Event
            </Button>
            <Button
              onClick={() =>
                setActionModal({
                  open: true,
                  action: "COMPLETED",
                  eventId: selectedEvent.id,
                  eventTitle: selectedEvent.title,
                })
              }
              className="flex-1 !h-11 !text-white !rounded-lg !bg-[#7C3AED] hover:!bg-[#6D28D9] !font-bold text-sm !shadow-none !border-none">
              Tandai Selesai
            </Button>
          </>
        )}
      </div>
    );
  };

  const renderDrawerContent = () => {
    if (!selectedEvent) return null;
    return (
      <div className="space-y-4 mt-2 pb-6">
        {selectedEvent.imageUrl && (
          <img
            src={selectedEvent.imageUrl}
            className="w-full h-44 object-cover rounded-xl mb-6 border border-gray-100"
            alt="Event Banner"
          />
        )}

        {/* --- INFORMASI UTAMA --- */}
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            Judul Event
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedEvent.title}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-2">
              Kategori
            </p>
            <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
              <p className="font-semibold text-sm text-slate-600">
                {formatCategory(selectedEvent.category)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-2">Topik</p>
            <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
              <p className="font-semibold text-sm text-slate-600 capitalize">
                {selectedEvent.topic?.toLowerCase() || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* --- DETAIL PELAKSANAAN --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Waktu Pelaksanaan
          </p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-2">
                  Tanggal Mulai
                </p>
                <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                  <p className="font-semibold text-sm text-slate-600">
                    {selectedEvent.date && selectedEvent.date !== "-"
                      ? dayjs(selectedEvent.date).format("DD MMM YYYY")
                      : "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-2">
                  Tanggal Selesai
                </p>
                <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                  <p className="font-semibold text-sm text-slate-600">
                    {selectedEvent.endDate && selectedEvent.endDate !== "-"
                      ? dayjs(selectedEvent.endDate).format("DD MMM YYYY")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Waktu Pelaksanaan
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200 flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-600">
                  {String(selectedEvent.startHour || 0).padStart(2, "0")}:00
                </span>
                <svg
                  viewBox="64 64 896 896"
                  focusable="false"
                  width="12px"
                  height="12px"
                  fill="currentColor"
                  className="text-slate-400">
                  <path d="M873.1 596.2l-164-208A32 32 0 00684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z" />
                </svg>
                <span className="font-semibold text-sm text-slate-600">
                  {String(selectedEvent.endHour || 0).padStart(2, "0")}:00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- LOKASI --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">Lokasi Event</p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Alamat Lengkap
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {selectedEvent.location || "-"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Kecamatan
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {formatDistrict(selectedEvent.district)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- KONTAK PERSON --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">Narahubung</p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">Nama</p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600 truncate">
                  {selectedEvent.contactName || "-"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Email / Kontak
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600 truncate">
                  {selectedEvent.contactEmail ||
                    selectedEvent.contactPhone ||
                    "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Event Saya</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor semua Event yang telah Anda buat dan kelola dengan mudah
          </p>
        </div>

        <Button
          type="primary"
          icon={<HiOutlinePlus className="text-[18px]" />}
          onClick={() => router.push("/vendor/events/create")}
          className="
            !h-10 !rounded-full !border-[#F1F5F9]   !text-white !font-semibold !shadow-none !bg-[#7C3AED]
            hover:!bg-[#612dbb] [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center
          ">
          Buat Event
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <DataTable columns={columns} dataSource={events} isLoading={loading} />
      </div>

      <CustomDrawer
        title={
          <span className="text-xl font-bold text-slate-800">Detail Event</span>
        }
        open={drawerOpen}
        setOpen={setDrawerOpen}
        content={renderDrawerContent()}
        extra={selectedEvent && statusBadge(selectedEvent.status)}
        footer={renderDrawerFooter()}
      />

      <DeleteModal
        open={deleteModal.open}
        dataName={deleteModal.eventTitle}
        onCancel={() =>
          setDeleteModal({ open: false, eventId: null, eventTitle: "" })
        }
        onDelete={() => {
          if (deleteModal.eventId) handleDelete(deleteModal.eventId);
          setDeleteModal({ open: false, eventId: null, eventTitle: "" });
        }}
      />

      {/* CUSTOM MODAL BATALKAN / SELESAIKAN EVENT */}
      <CustomModal
        open={actionModal.open}
        title={
          actionModal.action === "CANCELLED"
            ? "Batalkan Event?"
            : "Selesaikan Event?"
        }
        onClose={() =>
          setActionModal({
            open: false,
            action: null,
            eventId: null,
            eventTitle: "",
          })
        }
        footer={
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() =>
                setActionModal({
                  open: false,
                  action: null,
                  eventId: null,
                  eventTitle: "",
                })
              }
              className="flex-1 !h-11 !rounded-lg !border-gray-200 !text-slate-600 hover:!border-gray-300 !font-semibold">
              Tidak
            </Button>
            <Button
              danger={actionModal.action === "CANCELLED"}
              type="primary"
              onClick={() => {
                if (actionModal.eventId && actionModal.action) {
                  handleUpdateStatus(actionModal.eventId, actionModal.action);
                }
                setActionModal({
                  open: false,
                  action: null,
                  eventId: null,
                  eventTitle: "",
                });
              }}
              className={`flex-1 !h-11 !rounded-lg !font-semibold !border-none ${
                actionModal.action === "CANCELLED"
                  ? "!bg-red-500 hover:!bg-red-600 !text-white"
                  : "!bg-[#7C3AED] hover:!bg-[#6D28D9] !text-white"
              }`}>
              {actionModal.action === "CANCELLED"
                ? "Ya, Batalkan"
                : "Ya, Selesaikan"}
            </Button>
          </div>
        }>
        <div className="py-2">
          <p className="text-slate-600">
            {actionModal.action === "CANCELLED"
              ? `Apakah Anda yakin ingin membatalkan event "${actionModal.eventTitle}"?`
              : `Apakah Anda yakin ingin menyelesaikan event "${actionModal.eventTitle}"?`}
          </p>
          {actionModal.action === "CANCELLED" && (
            <p className="text-slate-400 text-sm mt-2">
              Dana participant akan dikembalikan secara otomatis.
            </p>
          )}
        </div>
      </CustomModal>
    </div>
  );
}
