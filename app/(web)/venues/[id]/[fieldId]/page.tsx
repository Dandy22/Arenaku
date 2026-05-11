"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message, Modal } from "antd";
import {
  HiArrowLeft,
  HiOutlineMapPin,
  HiOutlineLink,
  HiOutlineInformationCircle,
  HiOutlinePhone,
} from "react-icons/hi2";
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success("Link lapangan berhasil disalin!");
  };

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-slate-100 rounded-2xl h-72 animate-pulse mb-6" />
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
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-purple-500 mb-4 cursor-pointer transition-colors">
        <HiArrowLeft size={16} /> {venue?.name}
      </button>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden h-64 md:h-80 bg-slate-100 mb-6 shadow-sm border border-slate-100">
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
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">{field.name}</h1>

        <div className="flex flex-col items-start shrink-0">
          <span className="text-[11px] text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
            Bagikan Lapangan
          </span>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center cursor-pointer text-slate-600">
              <HiOutlineLink size={16} />
            </button>
            {/* Dummy FB Icon */}
            <button className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center cursor-pointer text-white">
              <svg
                width="14"
                height="14"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
              </svg>
            </button>
            {/* Dummy X Icon */}
            <button className="w-8 h-8 rounded-full bg-black hover:bg-slate-800 transition flex items-center justify-center cursor-pointer text-white">
              <svg
                width="14"
                height="14"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            {/* Dummy WA Icon */}
            <button className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 transition flex items-center justify-center cursor-pointer text-white">
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M12.031 2c-5.5 0-9.972 4.475-9.972 9.976 0 1.758.455 3.473 1.322 4.98L2 22l5.166-1.353c1.455.808 3.101 1.233 4.865 1.233 5.498 0 9.969-4.475 9.969-9.976S17.53 2 12.031 2zm5.498 14.368c-.227.638-1.322 1.205-1.821 1.261-.468.053-1.077.067-1.808-.178-.458-.153-1.096-.381-2.22-1.055-1.503-.902-2.457-2.433-2.528-2.528-.071-.096-1.503-2.001-1.503-3.818 0-1.817.946-2.712 1.282-3.045.337-.333.727-.419.968-.419.24 0 .48.001.693.01.235.011.551-.095.862.664.325.808 1.096 2.673 1.192 2.864.095.192.161.419.019.706-.142.287-.213.468-.426.719-.213.251-.444.536-.639.719-.213.21-.439.439-.199.827.24.388 1.066 1.705 2.261 2.704 1.545 1.29 2.825 1.69 3.223 1.882.397.192.628.163.864-.096.236-.259.988-1.15 1.253-1.545.265-.395.53-.328.892-.192.362.136 2.29.988 2.687 1.18.397.192.662.287.758.45.096.163.096.945-.131 1.583z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {field.description && (
        <div className="mb-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
            <HiOutlineInformationCircle className="text-purple-500" size={20} />
            Deskripsi Lapangan
          </h2>
          <p className="text-sm text-slate-500">{field.description}</p>

          <div className="flex justify-between items-center mt-4">
            {[
              { label: "Field Type", value: field.type },
              { label: "Floor Type", value: field.floorType || "-" },
              { label: "Length", value: `${field.length} M` },
              { label: "Width", value: `${field.width} M` },
            ].map((item) => (
              <div key={item.label} className="text-left">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-semibold text-slate-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      {field.contacts?.length > 0 && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
            <HiOutlinePhone className="text-purple-500" size={18} />
            Informasi Narahubung
          </h2>
          {field.contacts.map((c: any) => (
            <ul
              key={c.id}
              className="text-sm text-slate-500 list-disc list-inside space-y-0.5">
              <li>Nama: {c.name}</li>
              {c.email && <li>Email: {c.email}</li>}
              {c.phone && <li>Phone: {c.phone}</li>}
            </ul>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {(["jadwal", "gallery"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold uppercase transition cursor-pointer ${
              activeTab === tab
                ? "border-b-2 border-purple-500 text-purple-500"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Jadwal */}
      {activeTab === "jadwal" && (
        <div>
          <p className="text-sm text-slate-500 mb-4">Pilih Lapangan:</p>
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 mb-6">
            {field.name}
          </div>

          <div className="overflow-x-auto pb-4 px-1 -mx-1">
            <div className="flex gap-3 min-w-max mb-4">
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
            <div className="flex gap-3 min-w-max py-1">
              {schedule.map((day) => (
                <div
                  key={day.date}
                  className="w-32 shrink-0 flex flex-col gap-2">
                  {day.slots.map((slot) => {
                    const selected = isSelected(day.date, slot.startHour);
                    return (
                      <button
                        key={slot.startHour}
                        onClick={() => toggleSlot(day.date, slot)}
                        disabled={slot.status !== "AVAILABLE"}
                        className={`w-full rounded-lg p-2 text-center h-20 flex flex-col justify-center items-center transition text-xs border ${
                          slot.status === "PAST"
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border-transparent opacity-60"
                            : slot.status === "BOOKED"
                              ? "bg-red-100 text-red-400 cursor-not-allowed border-red-200"
                              : selected
                                ? "ring-2 ring-purple-500 text-purple-700 bg-purple-100 border-transparent cursor-pointer"
                                : "bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:shadow-sm cursor-pointer"
                        }`}>
                        <p
                          className={`font-semibold ${
                            selected
                              ? "text-purple-700"
                              : slot.status === "BOOKED"
                                ? "text-red-500"
                                : "text-slate-800"
                          }`}>
                          {slot.label.split(" - ")[0]} -{" "}
                          {slot.label.split(" - ")[1]}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            selected ? "text-purple-500" : "text-slate-500"
                          }`}>
                          Rp {slot.price?.toLocaleString("id-ID")}
                        </p>
                        <p
                          className={`text-xs font-medium mt-0.5 min-h-[16px] flex items-center ${
                            slot.status === "BOOKED"
                              ? "text-red-500"
                              : slot.status === "PAST"
                                ? "text-slate-400"
                                : selected
                                  ? "text-purple-500"
                                  : "text-green-500"
                          }`}>
                          {slot.status === "BOOKED"
                            ? "Booked"
                            : slot.status === "PAST"
                              ? "Selesai"
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
              className="aspect-video rounded-xl overflow-hidden bg-slate-100">
              <img
                src={img.url}
                alt="field"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {!field.images?.length && (
            <p className="text-slate-400 text-sm col-span-full text-center py-10">
              Belum ada foto
            </p>
          )}
        </div>
      )}

      {/* Location */}
      {venue?.latitude && venue?.longitude ? (
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-slate-900">Lokasi Venue</h2>

            <a
              href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold cursor-pointer hover:opacity-90 hover:shadow-md transition-all shrink-0"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #9333EA)",
              }}>
              <HiOutlineMapPin size={14} /> Panduan Ke Lokasi
            </a>
          </div>

          <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-4">
            <HiOutlineMapPin size={18} className="text-purple-500 shrink-0" />
            {venue.address}
          </p>

          <div className="rounded-xl overflow-hidden h-56 bg-slate-100 shadow-sm border border-slate-100">
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                {selectedSlots.length} slot dipilih
              </p>
              <p className="text-lg font-bold text-purple-700">
                Rp {totalPrice.toLocaleString("id-ID")}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`px-8 py-3 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed ${
                addingToCart
                  ? "bg-[#D1D5DB]"
                  : "bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C]"
              }`}>
              {addingToCart ? "Memproses..." : "LANJUT PEMBAYARAN"}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        title={
          <span className="font-bold text-slate-800">Konfirmasi Pemesanan</span>
        }
        open={confirmModal}
        onOk={confirmAddToCart}
        onCancel={() => setConfirmModal(false)}
        okText="Ya, Lanjutkan"
        cancelText="Batal"
        okButtonProps={{
          style: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
          className: "cursor-pointer",
        }}
        cancelButtonProps={{
          className: "cursor-pointer",
        }}>
        <p className="text-slate-500 mb-4 mt-2">
          Anda akan memesan <strong>{selectedSlots.length} slot</strong> dengan
          total:
        </p>
        <div className="bg-purple-50 p-4 rounded-xl mb-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-700">
            Rp {totalPrice.toLocaleString("id-ID")}
          </p>
        </div>
        <ul className="text-sm text-slate-500 space-y-1.5">
          {selectedSlots.slice(0, 3).map((slot: SelectedSlot, i: number) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              {slot.date} | {String(slot.startHour).padStart(2, "0")}:00 -{" "}
              {String(slot.endHour).padStart(2, "0")}:00
            </li>
          ))}
          {selectedSlots.length > 3 && (
            <li className="text-slate-400 italic mt-2">
              ...dan {selectedSlots.length - 3} slot lainnya
            </li>
          )}
        </ul>
      </Modal>
    </div>
  );
}
