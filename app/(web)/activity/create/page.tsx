"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message, Form, Input, Select, InputNumber, DatePicker } from "antd";
import { HiArrowLeft } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";
import dayjs from "dayjs";

const SPORT_CATEGORIES = [
  "FUTSAL", "BADMINTON", "BASKETBALL", "TENNIS",
  "MINI_SOCCER", "VOLLEYBALL", "PADEL",
];

export default function CreateActivityPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  if (!user) {
    router.push("/login");
    return null;
  }

  if (user.role !== "VENDOR") {
    router.push("/activity");
    return null;
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await api.post("/events", {
        title: values.title,
        description: values.description,
        location: values.location,
        city: values.city,
        category: values.category,
        imageUrl: values.imageUrl || "",
        date: dayjs(values.date).format("YYYY-MM-DD"),
        startHour: values.startHour,
        endHour: values.endHour,
        ticketPrice: values.ticketPrice || 0,
        capacity: values.capacity,
        additionalInfo: values.additionalInfo || "",
        termsConditions: values.termsConditions || "",
        contactName: values.contactName || "",
        contactEmail: values.contactEmail || "",
        contactPhone: values.contactPhone || "",
      });

      message.success("Event berhasil dibuat!");
      router.push("/activity");
    } catch (err: any) {
      if (err?.response?.data?.error) {
        message.error(err.response.data.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-24">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-6"
      >
        <HiArrowLeft size={16} /> Kembali
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Buat Aktivitas</h1>
      <p className="text-gray-500 text-sm mb-8">
        Buat event olahraga komunitas untuk diikuti oleh pengguna lain
      </p>

      <Form form={form} layout="vertical">

        {/* Poster URL + Preview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-bold text-gray-800 mb-4">Poster Event</h2>
          <Form.Item name="imageUrl" label="URL Poster">
            <Input
              placeholder="https://res.cloudinary.com/..."
              onChange={(e) => setImagePreview(e.target.value)}
            />
          </Form.Item>
          {imagePreview && (
            <div className="rounded-xl overflow-hidden aspect-video bg-gray-100 mt-2">
              <img
                src={imagePreview}
                alt="preview"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}
        </div>

        {/* Info Utama */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-bold text-gray-800 mb-4">Informasi Event</h2>

          <Form.Item name="title" label="Judul Event" rules={[{ required: true, message: "Judul wajib diisi" }]}>
            <Input placeholder="Contoh: Turnamen Futsal Komunitas 2026" />
          </Form.Item>

          <Form.Item name="category" label="Kategori Olahraga" rules={[{ required: true }]}>
            <Select placeholder="Pilih kategori">
              {SPORT_CATEGORIES.map((c) => (
                <Select.Option key={c} value={c}>{c}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Deskripsi" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Deskripsi event..." />
          </Form.Item>

          <div className="flex gap-3">
            <Form.Item name="location" label="Lokasi / Venue" rules={[{ required: true }]} className="flex-1">
              <Input placeholder="Contoh: GOR Senayan" />
            </Form.Item>
            <Form.Item name="city" label="Kota" className="flex-1">
              <Input placeholder="Contoh: Jakarta Selatan" />
            </Form.Item>
          </div>

          <Form.Item name="date" label="Tanggal Event" rules={[{ required: true }]}>
            <DatePicker
              style={{ width: "100%" }}
              format="DD MMMM YYYY"
              disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
            />
          </Form.Item>

          <div className="flex gap-3">
            <Form.Item name="startHour" label="Jam Mulai" rules={[{ required: true }]} className="flex-1">
              <Select placeholder="Pilih jam">
                {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => (
                  <Select.Option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="endHour" label="Jam Selesai" rules={[{ required: true }]} className="flex-1">
              <Select placeholder="Pilih jam">
                {Array.from({ length: 16 }, (_, i) => i + 7).map((h) => (
                  <Select.Option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="flex gap-3">
            <Form.Item name="ticketPrice" label="Harga Tiket (Rp)" className="flex-1">
              <InputNumber
                style={{ width: "100%" }}
                placeholder="0 = Gratis"
                min={0}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              />
            </Form.Item>
            <Form.Item name="capacity" label="Kapasitas Peserta" rules={[{ required: true }]} className="flex-1">
              <InputNumber style={{ width: "100%" }} placeholder="Contoh: 32" min={1} />
            </Form.Item>
          </div>
        </div>

        {/* Info Tambahan */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-bold text-gray-800 mb-4">Info Tambahan (Opsional)</h2>

          <Form.Item name="additionalInfo" label="Informasi Tambahan">
            <Input.TextArea
              rows={4}
              placeholder="Contoh:&#10;- Registrasi ulang 1 jam sebelum pertandingan&#10;- Bawa perlengkapan sendiri"
            />
          </Form.Item>

          <Form.Item name="termsConditions" label="Syarat dan Ketentuan">
            <Input.TextArea
              rows={4}
              placeholder="Contoh:&#10;- Biaya tidak dapat dikembalikan&#10;- Keputusan wasit bersifat final"
            />
          </Form.Item>
        </div>

        {/* Kontak */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-bold text-gray-800 mb-4">Informasi Narahubung (Opsional)</h2>

          <Form.Item name="contactName" label="Nama Narahubung">
            <Input placeholder="Contoh: Pak Budi" />
          </Form.Item>

          <div className="flex gap-3">
            <Form.Item name="contactEmail" label="Email" className="flex-1">
              <Input placeholder="email@mail.com" />
            </Form.Item>
            <Form.Item name="contactPhone" label="Nomor HP" className="flex-1">
              <Input placeholder="08123456789" />
            </Form.Item>
          </div>
        </div>

      </Form>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}
          >
            {submitting ? "Memproses..." : "Buat Aktivitas"}
          </button>
        </div>
      </div>
    </div>
  );
}