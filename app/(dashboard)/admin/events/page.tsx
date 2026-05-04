"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, message, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { HiOutlinePlus, HiEye, HiOutlinePencilSquare } from "react-icons/hi2";
import dayjs from "dayjs";
import api from "@/lib/axios";

import DataTable from "@/components/reusable/DataTable";
import AlertDialog from "@/components/reusable/AlertDialog";
import CustomDrawer from "@/components/reusable/CustomDrawer";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  district: string;
  category: string;
  topic?: string;
  imageUrl: string;
  date: string;
  endDate?: string;
  startHour: number;
  endHour: number;
  ticketPrice: number;
  capacity: number;
  status: string;
  participants: { id: string; userId: string }[];
  creator: { id: string; name: string; email: string };
  createdAt: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // DRAWER STATE (Untuk Detail)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // CANCEL MODAL STATE
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    eventId: string | null;
  }>({
    open: false,
    eventId: null,
  });

  const fetchEvents = () => {
    setLoading(true);
    api
      .get("/admin/events")
      .then((res) => {
        let data = res.data;
        if (filterStatus !== "ALL") {
          data = data.filter((e: Event) => e.status === filterStatus);
        }
        setEvents(data);
      })
      .catch(() => message.error("Gagal memuat data event"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  const handleCancelEvent = async (eventId: string) => {
    try {
      await api.post(`/admin/events/${eventId}/cancel`);
      message.success("Event berhasil dibatalkan");
      setDrawerOpen(false);
      fetchEvents();
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal membatalkan event");
    }
  };

  // --- BADGES & FORMATTERS ---
  const statusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      ACTIVE: { text: "Aktif", className: "text-green-600 bg-green-50" },
      CANCELLED: { text: "Dibatalkan", className: "text-red-600 bg-red-50" },
      COMPLETED: { text: "Selesai", className: "text-blue-600 bg-blue-50" },
      DRAFT: { text: "Draft", className: "text-slate-500 bg-slate-100" },
    };
    const item = map[status] || {
      text: status,
      className: "text-gray-600 bg-gray-50",
    };

    return (
      <div
        className={`inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
        <span>{item.text}</span>
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

  // --- TABLE COLUMNS ---
  const columns: ColumnsType<Event> = [
    {
      title: "Judul Event",
      dataIndex: "title",
      key: "title",
      render: (title) => (
        <span className="font-semibold text-sm text-slate-600">{title}</span>
      ),
    },
    {
      title: "Kategori",
      dataIndex: "category",
      key: "category",
      render: (category) => (
        <span className="text-sm font-semibold text-slate-500">
          {formatCategory(category)}
        </span>
      ),
    },
    {
      title: "Penyelenggara",
      key: "creator",
      render: (_, record) => (
        <span className="text-sm font-semibold text-slate-500">
          {record.creator?.name || "-"}
        </span>
      ),
    },
    {
      title: "Tanggal Pelaksanaan",
      dataIndex: "date",
      key: "date",
      render: (_, r) => {
        const hasDate = r.date && String(r.date) !== "-";
        if (!hasDate) return <span className="text-slate-400">-</span>;

        const hasEndDate = r.endDate && String(r.endDate) !== "-";
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
        // 1. Cek apakah data jam mulai ada
        const hasStart =
          record.startHour !== null &&
          record.startHour !== undefined &&
          String(record.startHour) !== "-";

        if (!hasStart) {
          return <span className="text-slate-400">-</span>;
        }

        // 2. Format jam mulai
        const start = String(record.startHour).padStart(2, "0");

        // 3. Cek apakah ada jam selesai
        const hasEnd =
          record.endHour !== null &&
          record.endHour !== undefined &&
          String(record.endHour) !== "-";

        return (
          <span className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            {start}:00
            {hasEnd && (
              <>
                <svg
                  viewBox="64 64 896 896"
                  width="12px"
                  height="12px"
                  fill="currentColor"
                  className="text-slate-400">
                  <path d="M873.1 596.2l-164-208A32 32 0 00684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z" />
                </svg>
                {String(record.endHour).padStart(2, "0")}:00
              </>
            )}
          </span>
        );
      },
    },

    {
      title: "Peserta",
      key: "participants",
      align: "center",
      render: (_, record) => (
        <span className="text-sm font-semibold text-slate-500">
          {record.participants?.length || 0}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => statusBadge(status),
    },
    {
      title: "Aksi",
      key: "action",
      fixed: "right",
      align: "right",
      width: 220,
      render: (_, record) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              setSelectedEvent(record);
              setDrawerOpen(true);
            }}
            icon={<HiEye className="text-[16px]" />}
            className="
            !h-9 !rounded-full !border-[#F1F5F9] !px-4  !text-blue-500 !font-semibold !shadow-none
            hover:!bg-blue-50 hover:!border-blue-200 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center
          ">
            Detail
          </Button>

          <Button
            onClick={() => router.push(`/admin/events/${record.id}`)}
            icon={<HiOutlinePencilSquare className="text-[16px]" />}
            className="
              !h-9 !rounded-full !border-[#F1F5F9] !px-4 !text-[#7C3AED] !font-semibold !shadow-none
              hover:!bg-purple-50 hover:!border-purple-200 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center
            ">
            Edit
          </Button>
        </div>
      ),
    },
  ];

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
                Durasi Waktu / Jam
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
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Nama Penyelenggara
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600 truncate">
                  {selectedEvent.contactName || "-"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Email / Kontak Handphone
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

  // --- DRAWER FOOTER ---
  const renderDrawerFooter = () => (
    <div className="flex items-center gap-3 w-full">
      <Button
        onClick={() => setDrawerOpen(false)}
        className="flex-1 !h-11 !rounded-lg !border-gray-300 hover:!bg-gray-50 !text-slate-600 !font-semibold !text-sm">
        Kembali
      </Button>

      {selectedEvent?.status === "ACTIVE" && (
        <Button
          onClick={() =>
            setCancelModal({ open: true, eventId: selectedEvent.id })
          }
          className="flex-1 !h-11 !rounded-lg !bg-red-500 hover:!bg-red-600 !text-white !font-bold text-sm tracking-wide border-none ">
          Batalkan Event
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Event</h1>
            <p className="text-gray-500 mt-1">Lihat dan kelola semua event</p>
          </div>
          <div className="flex gap-3">
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
              className="!h-10 [&_.ant-select-selector]:!rounded-full"
              options={[
                { label: "Semua Status", value: "ALL" },
                { label: "Aktif", value: "ACTIVE" },
                { label: "Dibatalkan", value: "CANCELLED" },
                { label: "Selesai", value: "COMPLETED" },
              ]}
            />
            <Button
              type="primary"
              onClick={() => router.push("/admin/events/new")}
              icon={<HiOutlinePlus className="text-[18px]" />}
              className="
            !h-10 !rounded-full !border-[#F1F5F9] !px-4  !text-white !font-semibold !shadow-none !bg-[#7C3AED]
            hover:!bg-[#612dbb] [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center
          ">
              Buat Event
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <DataTable
            columns={columns}
            dataSource={events}
            isLoading={loading}
            totalData={events.length}
            totalPage={1}
            page={1}
            limit={10}
            showSearch
            searchPlaceholder="Cari judul event..."
          />
        </div>

        {/* CUSTOM DRAWER DETAIL */}
        <CustomDrawer
          title={
            <span className="text-xl font-bold text-slate-800">
              Detail Event
            </span>
          }
          open={drawerOpen}
          setOpen={setDrawerOpen}
          content={renderDrawerContent()}
          extra={selectedEvent && statusBadge(selectedEvent.status)}
          footer={renderDrawerFooter()}
        />

        {/* ALERT MODAL BATALKAN EVENT */}
        <AlertDialog
          open={cancelModal.open}
          danger
          title="Batalkan Event?"
          description="Apakah Anda yakin ingin membatalkan event ini? Dana participant akan dikembalikan secara otomatis sesuai kebijakan."
          confirmText="Ya, Batalkan"
          cancelText="Tutup"
          onCancel={() => setCancelModal({ open: false, eventId: null })}
          onConfirm={() => {
            if (cancelModal.eventId) {
              handleCancelEvent(cancelModal.eventId);
            }
            setCancelModal({ open: false, eventId: null });
          }}
        />
      </div>
    </>
  );
}
