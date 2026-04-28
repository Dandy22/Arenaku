"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message, Modal } from "antd";
import { HiArrowLeft, HiOutlineMapPin } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import { useCartStore } from "@/lib/store/cart.store";
import api from "@/lib/axios";

interface Slot {
  startHour: number;
  endHour: number;
  label: string;
  price: number;
  status: "AVAILABLE" | "BOOKED" | "PAST";
}

interface DaySchedule {
  date: string;
  dayName: string;
  dayDate: string;
  slots: Slot[];
}

interface SelectedSlot {
  date: string;
  startHour: number;
  endHour: number;
  price: number;
}

export default function FieldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchCart } = useCartStore();

  const venueId = params.id as string;
  const fieldId = params.fieldId as string;

  const [field, setField] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jadwal" | "gallery">("jadwal");
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const startDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      api.get(`/fields/${fieldId}`),
      api.get(`/venues/${venueId}`),
      api.get(`/fields/${fieldId}/schedule?startDate=${startDate}`),
    ])
      .then(([fieldRes, venueRes, scheduleRes]) => {
        setField(fieldRes.data);
        setVenue(venueRes.data);
        setSchedule(scheduleRes.data.days || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fieldId, venueId]);

  const toggleSlot = (date: string, slot: Slot) => {
    if (slot.status !== "AVAILABLE") return;
    const exists = selectedSlots.find(
      (s: SelectedSlot) => s.date === date && s.startHour === slot.startHour,
    );
    if (exists) {
      setSelectedSlots(
        selectedSlots.filter(
          (s: SelectedSlot) =>
            !(s.date === date && s.startHour === slot.startHour),
        ),
      );
    } else {
      setSelectedSlots([
        ...selectedSlots,
        {
          date,
          startHour: slot.startHour,
          endHour: slot.endHour,
          price: slot.price,
        },
      ]);
    }
  };

  const isSelected = (date: string, startHour: number) =>
    selectedSlots.some(
      (s: SelectedSlot) => s.date === date && s.startHour === startHour,
    );

  const handleAddToCart = async () => {
    if (!user) {
      message.warning("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }
    if (selectedSlots.length === 0) {
      message.warning("Pilih minimal 1 slot waktu");
      return;
    }
    setConfirmModal(true);
  };

  const confirmAddToCart = async () => {
    setConfirmModal(false);
    setAddingToCart(true);
    try {
      await Promise.all(
        selectedSlots.map((slot: SelectedSlot) =>
          api.post("/cart", {
            fieldId,
            date: slot.date,
            startHour: slot.startHour,
            endHour: slot.endHour,
          }),
        ),
      );
      await fetchCart();
      message.success(
        `${selectedSlots.length} slot berhasil ditambahkan ke cart`,
      );
      setSelectedSlots([]);
      router.push("/cart");
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal menambahkan ke cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-gray-100 rounded-2xl h-72 animate-pulse mb-6" />
      </div>
    );

  if (!field) return null;

  const totalPrice = selectedSlots.reduce(
    (a: number, s: SelectedSlot) => a + s.price,
    0,
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 pb-28">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push(`/venues/${venueId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 mb-4">
        <HiArrowLeft size={16} /> {venue?.name}
      </button>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden h-64 md:h-80 bg-gray-100 mb-6">
        <img
          src={
            field.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200"
          }
          alt={field.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Field info */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
        <div className="text-right text-sm text-gray-500">
          <p className="mb-1">Bagikan Venue</p>
          <div className="flex gap-2">
            {["📋", "📘", "✖️", "💬"].map((icon, i) => (
              <button
                key={i}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-sm">
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {field.description && (
        <div className="mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
            🏢 Deskripsi Lapangan
          </h2>
          <p className="text-sm text-gray-600">{field.description}</p>
          <div className="grid grid-cols-4 gap-4 mt-3">
            {[
              { label: "Field Type", value: field.type },
              { label: "Floor Type", value: field.floorType || "-" },
              { label: "Length", value: `${field.length} M` },
              { label: "Width", value: `${field.width} M` },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      {field.contacts?.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
            📋 Informasi Narahubung
          </h2>
          {field.contacts.map((c: any) => (
            <ul
              key={c.id}
              className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
              <li>Nama: {c.name}</li>
              {c.email && <li>Email: {c.email}</li>}
              {c.phone && <li>Phone: {c.phone}</li>}
            </ul>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["jadwal", "gallery"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold uppercase transition ${
              activeTab === tab
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Jadwal */}
      {activeTab === "jadwal" && (
        <div>
          <p className="text-sm text-gray-600 mb-4">Pilih Lapangan:</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 mb-6">
            {field.name}
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max mb-4">
              {schedule.map((day) => {
                const isToday =
                  day.date === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={day.date}
                    className={`w-32 shrink-0 rounded-xl px-3 py-2 text-center text-sm font-bold ${
                      isToday ? "text-white" : "bg-purple-50 text-purple-700"
                    }`}
                    style={
                      isToday
                        ? {
                            background:
                              "linear-gradient(135deg, #7C3AED, #9333EA)",
                          }
                        : {}
                    }>
                    <p>{day.dayDate}</p>
                    <p className="font-normal text-xs opacity-80">
                      {day.dayName}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 min-w-max">
              {schedule.map((day) => (
                <div
                  key={day.date}
                  className="w-32 shrink-0 flex flex-col gap-1.5">
                  {day.slots.map((slot) => {
                    const selected = isSelected(day.date, slot.startHour);
                    return (
                      <button
                        key={slot.startHour}
                        onClick={() => toggleSlot(day.date, slot)}
                        disabled={slot.status !== "AVAILABLE"}
                        className={`w-full rounded-lg p-2 text-center transition text-xs ${
                          slot.status === "PAST"
                            ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                            : slot.status === "BOOKED"
                              ? "bg-red-50 text-red-400 cursor-not-allowed"
                              : selected
                                ? "ring-2 ring-purple-500 text-purple-700 bg-purple-50"
                                : "bg-white border border-gray-200 text-gray-700 hover:border-purple-300"
                        }`}>
                        <p
                          className={`font-semibold ${
                            selected
                              ? "text-purple-700"
                              : slot.status === "BOOKED"
                                ? "text-red-500"
                                : ""
                          }`}>
                          {slot.label.split(" - ")[0]} -{" "}
                          {slot.label.split(" - ")[1]}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            selected ? "text-purple-600" : "text-gray-500"
                          }`}>
                          Rp. {slot.price?.toLocaleString("id-ID")}
                        </p>
                        <p
                          className={`text-xs font-medium mt-0.5 ${
                            slot.status === "BOOKED"
                              ? "text-red-500"
                              : slot.status === "PAST"
                                ? "text-gray-300"
                                : selected
                                  ? "text-purple-600"
                                  : "text-green-600"
                          }`}>
                          {slot.status === "BOOKED"
                            ? "Booked"
                            : slot.status === "PAST"
                              ? ""
                              : "Tersedia"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Gallery */}
      {activeTab === "gallery" && (
        <div className="grid grid-cols-2 gap-4">
          {field.images?.map((img: any) => (
            <div
              key={img.id}
              className="aspect-video rounded-xl overflow-hidden bg-gray-100">
              <img
                src={img.url}
                alt="field"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {!field.images?.length && (
            <p className="text-gray-400 text-sm col-span-full">
              Belum ada foto
            </p>
          )}
        </div>
      )}

      {/* Location */}
      {/* Location */}
      {venue?.latitude && venue?.longitude ? (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Lokasi Venue</h2>

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <HiOutlineMapPin size={16} className="text-purple-600" />
              {venue.address}
            </p>

            <a
              href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #9333EA)",
              }}>
              📍 Panduan Ke Lokasi
            </a>
          </div>

          <div className="rounded-xl overflow-hidden h-56 bg-gray-100">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${venue.latitude},${venue.longitude}&z=15&output=embed`}
            />
          </div>
        </div>
      ) : null}
      {/* Sticky bottom bar */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">
                {selectedSlots.length} slot dipilih
              </p>
              <p className="text-lg font-bold text-purple-700">
                Rp. {totalPrice.toLocaleString("id-ID")}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="px-8 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #EF4444, #DC2626)",
              }}>
              {addingToCart ? "Memproses..." : "LANJUT PEMBAYARAN"}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        title="Konfirmasi Pemesanan"
        open={confirmModal}
        onOk={confirmAddToCart}
        onCancel={() => setConfirmModal(false)}
        okText="Ya, Lanjutkan"
        cancelText="Batal"
        okButtonProps={{
          style: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
        }}>
        <p className="text-gray-600 mb-4">
          Anda akan memesan <strong>{selectedSlots.length} slot</strong> dengan
          total:
        </p>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-2xl font-bold text-purple-700">
            Rp. {totalPrice.toLocaleString("id-ID")}
          </p>
        </div>
        <ul className="text-sm text-gray-600 space-y-1">
          {selectedSlots.slice(0, 3).map((slot: SelectedSlot, i: number) => (
            <li key={i}>
              • {slot.date} | {String(slot.startHour).padStart(2, "0")}:00 -{" "}
              {String(slot.endHour).padStart(2, "0")}:00
            </li>
          ))}
          {selectedSlots.length > 3 && (
            <li className="text-gray-400">
              ...dan {selectedSlots.length - 3} slot lainnya
            </li>
          )}
        </ul>
      </Modal>
    </div>
  );
}
