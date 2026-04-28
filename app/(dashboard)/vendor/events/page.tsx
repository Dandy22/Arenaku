"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  message,
  Modal,
  Input,
  Select,
  DatePicker,
  InputNumber,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineCalendar,
  HiOutlineMapPin,
} from "react-icons/hi2";
import dayjs from "dayjs";
import api from "@/lib/axios";
import { BEKASI_DISTRICTS, EVENT_CATEGORIES } from "@/lib/constants";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  district: string;
  category: string;
  imageUrl: string;
  date: string;
  startHour: number;
  endHour: number;
  ticketPrice: number;
  capacity: number;
  status: string;
  participants: { id: string; userId: string }[];
  creator: { id: string; name: string };
  createdAt: string;
}

export default function VendorEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    district: "",
    category: "",
    imageUrl: "",
    date: "",
    startHour: 8,
    endHour: 22,
    ticketPrice: 0,
    capacity: 50,
    additionalInfo: "",
    termsConditions: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const fetchEvents = () => {
    setLoading(true);
    api
      .get("/vendor/events")
      .then((res) => setEvents(res.data))
      .catch(() => message.error("Gagal memuat data event"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.location || !form.date) {
      message.error("Mohon lengkapi field wajib");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/vendor/events", {
        ...form,
        date: form.date,
        city: "Kota Bekasi",
      });
      message.success("Event berhasil dibuat");
      setModalOpen(false);
      setForm({
        title: "",
        description: "",
        location: "",
        district: "",
        category: "",
        imageUrl: "",
        date: "",
        startHour: 8,
        endHour: 22,
        ticketPrice: 0,
        capacity: 50,
        additionalInfo: "",
        termsConditions: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
      fetchEvents();
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal membuat event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (eventId: string) => {
    Modal.confirm({
      title: "Batalkan Event",
      content:
        "Apakah Anda yakin ingin membatalkan event ini? Participant akan dikembalikan.",
      okText: "Ya, Batalkan",
      cancelText: "Tidak",
      onOk: async () => {
        try {
          await api.post(`/vendor/events/${eventId}/cancel`);
          message.success("Event berhasil dibatalkan");
          fetchEvents();
        } catch (err: any) {
          message.error(err.response?.data?.error || "Gagal membatalkan event");
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Tag color="green">Aktif</Tag>;
      case "CANCELLED":
        return <Tag color="red">Dibatalkan</Tag>;
      case "COMPLETED":
        return <Tag color="blue">Selesai</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: ColumnsType<Event> = [
    {
      title: "Event",
      key: "event",
      render: (_, r) => (
        <div className="flex items-center gap-3">
          {r.imageUrl && (
            <img
              src={r.imageUrl}
              alt={r.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="font-medium text-gray-800">{r.title}</p>
            <p className="text-xs text-gray-500">{r.category}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Lokasi",
      key: "location",
      render: (_, r) => (
        <div>
          <p className="text-sm">{r.location}</p>
          <p className="text-xs text-gray-500">{r.district || "Kota Bekasi"}</p>
        </div>
      ),
    },
    {
      title: "Tanggal & Waktu",
      key: "date",
      render: (_, r) => (
        <div>
          <p className="text-sm font-medium">
            {dayjs(r.date).format("DD MMM YYYY")}
          </p>
          <p className="text-xs text-gray-500">
            {r.startHour}:00 - {r.endHour}:00
          </p>
        </div>
      ),
    },
    {
      title: "Tiket",
      key: "ticket",
      render: (_, r) => (
        <div>
          <p className="text-sm font-medium">
            Rp {r.ticketPrice.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-gray-500">
            {r.participants.length}/{r.capacity} peserta
          </p>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, r) =>
        r.status === "ACTIVE" && (
          <Button size="small" danger onClick={() => handleCancel(r.id)}>
            Batalkan
          </Button>
        ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Event</h1>
          <p className="text-gray-500 mt-1">Kelola event yang Anda buat</p>
        </div>
        <Button
          type="primary"
          icon={<HiOutlinePlus size={18} />}
          onClick={() => setModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700">
          Buat Event
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={events}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Buat Event Baru"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={700}>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Judul Event *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nama event"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <Input.TextArea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Deskripsi event"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <Select
                value={form.category || undefined}
                onChange={(val) => setForm({ ...form, category: val })}
                placeholder="Pilih kategori"
                className="w-full"
                options={EVENT_CATEGORIES}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Kecamatan
              </label>
              <Select
                value={form.district || undefined}
                onChange={(val) => setForm({ ...form, district: val })}
                placeholder="Pilih kecamatan"
                className="w-full"
                options={BEKASI_DISTRICTS}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lokasi *</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Alamat lengkap"
              prefix={<HiOutlineMapPin size={16} />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tanggal *
              </label>
              <DatePicker
                value={form.date ? dayjs(form.date) : null}
                onChange={(date) =>
                  setForm({
                    ...form,
                    date: date ? date.format("YYYY-MM-DD") : "",
                  })
                }
                className="w-full"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Gambar URL
              </label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Jam Mulai
              </label>
              <InputNumber
                value={form.startHour}
                onChange={(val) => setForm({ ...form, startHour: val || 8 })}
                min={0}
                max={23}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Jam Selesai
              </label>
              <InputNumber
                value={form.endHour}
                onChange={(val) => setForm({ ...form, endHour: val || 22 })}
                min={0}
                max={23}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Harga Tiket (Rp)
              </label>
              <InputNumber
                value={form.ticketPrice}
                onChange={(val) => setForm({ ...form, ticketPrice: val || 0 })}
                min={0}
                className="w-full"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Kapasitas
              </label>
              <InputNumber
                value={form.capacity}
                onChange={(val) => setForm({ ...form, capacity: val || 50 })}
                min={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Narahubung
              </label>
              <Input
                value={form.contactName}
                onChange={(e) =>
                  setForm({ ...form, contactName: e.target.value })
                }
                placeholder="Nama"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telepon</label>
              <Input
                value={form.contactPhone}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
                }
                placeholder="0812..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Informasi Tambahan
            </label>
            <Input.TextArea
              value={form.additionalInfo}
              onChange={(e) =>
                setForm({ ...form, additionalInfo: e.target.value })
              }
              placeholder="Informasi tambahan untuk peserta"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Syarat & Ketentuan
            </label>
            <Input.TextArea
              value={form.termsConditions}
              onChange={(e) =>
                setForm({ ...form, termsConditions: e.target.value })
              }
              placeholder="Syarat dan ketentuan event"
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
