"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import {
  Button,
  message,
  Input,
  Select,
  InputNumber,
  Table,
  Space,
  DatePicker,
  Switch,
  TimePicker,
  Modal,
} from "antd";

import {
  HiOutlinePlus,
  HiOutlineMapPin,
  HiOutlineTrash,
  HiOutlinePencil,
  HiArrowLeft,
  HiOutlineArrowUpTray,
} from "react-icons/hi2";

import api from "@/lib/axios";
import DeleteModal from "@/components/reusable/DeleteModal";
import dayjs from "dayjs";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-lg" />,
});
import "react-quill-new/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

interface EventTicketTier {
  id?: string;
  eventId?: string;
  name: string;
  stock: number;
  description: string;
  price?: number;
  isFree?: boolean;
}

interface Event {
  id: string;
  title: string;
  date: string;
  status: string;
}

export default function VendorEventDynamicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string>("");
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<EventTicketTier[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // STATE: FORM EVENT BARU
  // ---------------------------------------------------------------------------
  const [uploadingImage, setUploadingImage] = useState(false);
  const [eventFormSubmitting, setEventFormSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    district: "",
    city: "Kota Bekasi",
    category: "",
    topic: "",
    imageUrl: "",
    date: null as any,
    startHour: 8,
    endHour: 22,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    limitPerEmail: true,
    maxTicketsPerTransaction: 1,
    capacity: 1000,
  });

  const [localTickets, setLocalTickets] = useState<EventTicketTier[]>([]);

  // State untuk Delete Modal Tiket
  const [deleteTicketModal, setDeleteTicketModal] = useState<{
    open: boolean;
    ticketId: string | null;
    ticketName: string;
  }>({
    open: false,
    ticketId: null,
    ticketName: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketForm, setTicketForm] = useState<EventTicketTier>({
    name: "",
    stock: 0,
    description: "",
    price: 0,
    isFree: false,
  });

  // --- HANDLER UPLOAD FOTO ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      message.error("Ukuran gambar maksimal 2 MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      handleEventFormChange("imageUrl", res.data.url);
      message.success("Foto berhasil diupload!");
    } catch (error) {
      message.error("Gagal upload foto");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEventFormChange = (key: string, value: any) => {
    setEventForm((prev) => ({ ...prev, [key]: value }));
  };

  // --- HANDLER SIMPAN DRAF ---
  const handleSaveDraft = async () => {
    if (!eventForm.title) {
      message.warning(
        "Masukkan minimal 'Nama Event' untuk menyimpan sebagai draf.",
      );
      return;
    }

    setEventFormSubmitting(true);
    try {
      const currentTickets = isNewEvent ? localTickets : tickets;
      const totalCapacity = currentTickets.reduce(
        (acc, t) => acc + (t.stock || 0),
        0,
      );

      const startDate =
        eventForm.date && eventForm.date[0]
          ? eventForm.date[0].toISOString()
          : "-";
      const endDate =
        eventForm.date && eventForm.date[1]
          ? eventForm.date[1].toISOString()
          : "-";

      const eventPayload = {
        ...eventForm,
        capacity: totalCapacity,
        date: startDate,
        endDate: endDate,
        description: eventForm.description || "-",
        location: eventForm.location || "-",
        topic: eventForm.topic || "-",
        contactName: eventForm.contactName || "-",
        contactEmail: eventForm.contactEmail || "-",
        contactPhone: eventForm.contactPhone || "-",
        status: "DRAFT",
      };

      if (isNewEvent) {
        const resEvent = await api.post("/vendor/events", eventPayload);
        const newId = resEvent.data.id;
        for (const ticket of localTickets) {
          await api.post(`/events/${newId}/tickets`, {
            ...ticket,
            price: ticket.isFree ? 0 : ticket.price || 0,
            eventId: newId,
          });
        }
      } else {
        await api.patch(`/events/${eventId}`, eventPayload);
      }

      message.success("Event disimpan sebagai draf!");
      router.push("/vendor/events");
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal menyimpan draf");
    } finally {
      setEventFormSubmitting(false);
    }
  };

  // --- HANDLER BUAT/SIMPAN EVENT (WAJIB ADA FOTO) ---
  const handleSaveEvent = async () => {
    if (!eventForm.imageUrl) {
      message.error("Mohon unggah Foto Banner event!");
      return;
    }

    if (
      !eventForm.title ||
      !eventForm.location ||
      !eventForm.district ||
      !eventForm.category ||
      !eventForm.topic ||
      !eventForm.description ||
      !eventForm.date ||
      !eventForm.date[0] ||
      !eventForm.date[1] ||
      eventForm.latitude === undefined ||
      eventForm.longitude === undefined
    ) {
      message.error(
        "Mohon lengkapi semua field yang bertanda bintang (*) dan koordinat lokasi!",
      );
      return;
    }

    const currentTickets = isNewEvent ? localTickets : tickets;
    if (currentTickets.length === 0) {
      message.error("Mohon tambahkan minimal satu kategori tiket!");
      return;
    }

    setEventFormSubmitting(true);
    try {
      const totalCapacity = currentTickets.reduce(
        (acc, t) => acc + (t.stock || 0),
        0,
      );

      const eventPayload = {
        title: eventForm.title,
        imageUrl: eventForm.imageUrl,
        description: eventForm.description,
        location: eventForm.location,
        district: eventForm.district,
        city: eventForm.city,
        category: eventForm.category,
        topic: eventForm.topic,
        latitude: eventForm.latitude,
        longitude: eventForm.longitude,
        contactName: eventForm.contactName,
        contactEmail: eventForm.contactEmail,
        contactPhone: eventForm.contactPhone,
        startHour: eventForm.startHour,
        endHour: eventForm.endHour,
        capacity: totalCapacity,
        date: eventForm.date?.[0]?.toISOString(),
        endDate: eventForm.date?.[1]?.toISOString(),
        status: "ACTIVE", // Force status jadi active
      };

      let finalEventId = eventId;

      if (isNewEvent) {
        const resEvent = await api.post("/vendor/events", eventPayload);
        finalEventId = resEvent.data.id;
        for (const ticket of localTickets) {
          await api.post(`/events/${finalEventId}/tickets`, {
            ...ticket,
            price: ticket.isFree ? 0 : ticket.price || 0,
            eventId: finalEventId,
          });
        }
      } else {
        await api.patch(`/events/${eventId}`, eventPayload);
      }

      message.success(
        isNewEvent ? "Event berhasil dibuat!" : "Event berhasil diperbarui!",
      );
      router.push(`/vendor/events`);
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal menyimpan event");
    } finally {
      setEventFormSubmitting(false);
    }
  };

  // --- HANDLER LOAD DATA (EDIT DRAF) ---
  const fetchEventDataForResume = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${id}`);
      const data = res.data;
      setEvent(data);

      let parsedDate = null;
      if (
        data.date &&
        data.date !== "-" &&
        data.endDate &&
        data.endDate !== "-"
      ) {
        parsedDate = [dayjs(data.date), dayjs(data.endDate)];
      }

      setEventForm({
        title: data.title && data.title !== "-" ? data.title : "",
        description:
          data.description && data.description !== "-" ? data.description : "",
        category: data.category || "",
        location: data.location && data.location !== "-" ? data.location : "",
        district: data.district || "",
        city: data.city || "Kota Bekasi",
        topic: data.topic && data.topic !== "-" ? data.topic : "",
        imageUrl: data.imageUrl || "",
        date: parsedDate,
        startHour: data.startHour || 8,
        endHour: data.endHour || 22,
        contactName:
          data.contactName && data.contactName !== "-" ? data.contactName : "",
        contactEmail:
          data.contactEmail && data.contactEmail !== "-"
            ? data.contactEmail
            : "",
        contactPhone:
          data.contactPhone && data.contactPhone !== "-"
            ? data.contactPhone
            : "",
        latitude: data.latitude,
        longitude: data.longitude,
        limitPerEmail: data.limitPerEmail ?? true,
        maxTicketsPerTransaction: data.maxTicketsPerTransaction || 1,
        capacity: data.capacity || 0,
      });
    } catch (error) {
      message.error("Gagal mengambil data draf");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${id}/tickets`);
      setTickets(res.data);
    } catch (error) {
      message.error("Gagal memuat tiket");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const initParams = async () => {
      const { id } = await params;
      setEventId(id);
      if (id === "new" || id === "create") {
        setIsNewEvent(true);
        setLoading(false);
      } else {
        setIsNewEvent(false);
        fetchEventDataForResume(id);
        fetchTickets(id);
      }
    };
    initParams();
  }, [params]);

  // ---------------------------------------------------------------------------
  // HANDLERS TIKET (GABUNGAN LOCAL & LIVE)
  // ---------------------------------------------------------------------------
  const resetTicketForm = () => {
    setTicketForm({
      name: "",
      stock: 0,
      description: "",
      price: 0,
      isFree: false,
    });
    setEditingId(null);
  };

  const handleTicketSubmit = async () => {
    if (!ticketForm.name || ticketForm.stock <= 0) {
      message.error("Mohon lengkapi Nama dan Jumlah tiket");
      return;
    }

    const finalTicket = {
      ...ticketForm,
      price: ticketForm.isFree ? 0 : ticketForm.price,
    };

    if (isNewEvent) {
      if (editingId !== null) {
        setLocalTickets(
          localTickets.map((t, i) =>
            i.toString() === editingId ? finalTicket : t,
          ),
        );
      } else {
        setLocalTickets([...localTickets, finalTicket]);
      }
      setModalOpen(false);
      resetTicketForm();
    } else {
      setTicketSubmitting(true);
      try {
        if (editingId) {
          await api.put(`/events/${eventId}/tickets/${editingId}`, finalTicket);
          message.success("Tiket diperbarui");
          setTickets(
            tickets.map((t) =>
              t.id === editingId ? { ...t, ...finalTicket } : t,
            ),
          );
        } else {
          const res = await api.post(`/events/${eventId}/tickets`, finalTicket);
          message.success("Tiket ditambahkan");
          setTickets([...tickets, res.data]);
        }
        setModalOpen(false);
        resetTicketForm();
        fetchTickets(eventId);
      } catch (err: any) {
        message.error("Gagal menyimpan tiket");
      } finally {
        setTicketSubmitting(false);
      }
    }
  };

  const handleDeleteTicket = async (idOrIndex: string) => {
    if (isNewEvent) {
      setLocalTickets((prev) =>
        prev.filter((_, i) => i.toString() !== idOrIndex),
      );
      setDeleteTicketModal({ open: false, ticketId: null, ticketName: "" });
      message.success("Tiket dihapus");
    } else {
      setTicketSubmitting(true);
      try {
        await api.delete(`/events/${eventId}/tickets/${idOrIndex}`);
        message.success("Tiket berhasil dihapus");
        fetchTickets(eventId);
        setDeleteTicketModal({ open: false, ticketId: null, ticketName: "" });
      } catch (err: any) {
        message.error("Gagal menghapus tiket");
      } finally {
        setTicketSubmitting(false);
      }
    }
  };

  const FormLabel = ({
    text,
    subtext,
    required = false,
  }: {
    text: string;
    subtext?: string;
    required?: boolean;
  }) => (
    <div className="mb-2">
      <label className="block text-xs font-semibold text-slate-500">
        {text} {required && <span className="text-red-500">*</span>}
      </label>
      {subtext && (
        <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>
      )}
    </div>
  );

  const currentTickets = isNewEvent ? localTickets : tickets;

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------

  if (!isNewEvent && loading && !event) {
    return (
      <div className="flex justify-center p-20 text-gray-500">
        Memuat data...
      </div>
    );
  }

  if (!isNewEvent && !loading && !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-slate-500 font-medium">Event tidak ditemukan</p>
        <Button
          onClick={() => router.push("/vendor/events")}
          className="!rounded-full !font-semibold">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-800 font-semibold text-sm mb-4 transition">
          <HiArrowLeft className="text-lg" />
          Kembali
        </button>
      </div>

      {isNewEvent || event?.status === "DRAFT" ? (
        // =====================================================================
        // HALAMAN CREATE NEW EVENT ATAU EDIT DRAFT
        // =====================================================================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* KOLOM KIRI */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-6">
                <p className="text-xs text-slate-400 font-medium">
                  Informasi Event
                </p>
                <h2 className="text-xl font-bold text-slate-800">Data Event</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <FormLabel text="Foto Banner" required />
                  <div>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />

                      <div className="w-full h-80 bg-[#F5F3FF] rounded-xl border-2 border-dashed border-[#DDD6FE] flex flex-col items-center justify-center hover:bg-purple-50 transition">
                        {eventForm.imageUrl ? (
                          <img
                            src={eventForm.imageUrl}
                            alt="preview"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-[#EEDEFF] rounded-lg flex items-center justify-center mb-3">
                              <HiOutlineArrowUpTray className="text-2xl text-[#7C3AED]" />
                            </div>

                            <p className="text-sm font-semibold text-[#7C3AED]">
                              {uploadingImage
                                ? "Mengupload..."
                                : "Klik untuk unggah gambar/poster/banner"}
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              Gunakan ukuran 724 x 340 px (maksimal 2 MB)
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <FormLabel text="Nama Event" required />
                  <Input
                    placeholder="Masukkan nama eventmu"
                    value={eventForm.title}
                    onChange={(e) =>
                      handleEventFormChange("title", e.target.value)
                    }
                    className="!rounded-lg !py-2.5 !border-gray-200 text-slate-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel text="Tanggal Pelaksanaan " required />
                    <DatePicker.RangePicker
                      className="!w-full !rounded-lg !py-2.5 !border-gray-200 text-slate-500 font-semibold"
                      placeholder={["Tanggal awal", "Tanggal akhir"]}
                      value={eventForm.date}
                      onChange={(dates) => handleEventFormChange("date", dates)}
                    />
                  </div>
                  <div>
                    <FormLabel text="Jam Pelaksanaan" required />
                    <TimePicker.RangePicker
                      className="!w-full !rounded-lg !py-2.5 !border-gray-200 text-slate-500 font-semibold"
                      format="HH:mm"
                      value={[
                        dayjs().hour(eventForm.startHour).minute(0),
                        dayjs().hour(eventForm.endHour).minute(0),
                      ]}
                      placeholder={["Jam Buka", "Jam Tutup"]}
                      onChange={(times) => {
                        if (times && times[0] && times[1]) {
                          handleEventFormChange("startHour", times[0].hour());
                          handleEventFormChange("endHour", times[1].hour());
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <FormLabel text="Kategori Event" required />
                    <Select
                      placeholder="Pilih format eventmu"
                      value={eventForm.category || undefined}
                      onChange={(value) =>
                        handleEventFormChange("category", value)
                      }
                      className="!w-full !h-[42px] [&_.ant-select-selector]:!rounded-lg text-slate-500 font-semibold"
                      options={[
                        { label: "Turnamen", value: "TOURNAMENT" },
                        { label: "Olahraga", value: "SPORTS" },
                      ]}
                    />
                  </div>
                  <div>
                    <FormLabel text="Topik / Cabang" required />
                    <Select
                      placeholder="Pilih topik eventmu"
                      value={eventForm.topic || undefined}
                      onChange={(value) =>
                        handleEventFormChange("topic", value)
                      }
                      className="!w-full !h-[42px] [&_.ant-select-selector]:!rounded-lg text-slate-500 font-semibold"
                      options={[
                        { label: "Futsal", value: "FUTSAL" },
                        { label: "Badminton", value: "BADMINTON" },
                        { label: "Mini Soccer", value: "MINI_SOCCER" },
                        { label: "Basket", value: "BASKETBALL" },
                        { label: "Tenis", value: "TENNIS" },
                        { label: "Bola Voli", value: "VOLLEYBALL" },
                        { label: "Padel", value: "PADEL" },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <FormLabel text="Lokasi" required />
                  <Input
                    placeholder="Masukkan lokasi eventmu"
                    suffix={
                      <HiOutlineMapPin className="text-slate-400 text-lg" />
                    }
                    value={eventForm.location}
                    onChange={(e) =>
                      handleEventFormChange("location", e.target.value)
                    }
                    className="!rounded-lg !py-2.5 !border-gray-200 text-slate-500 font-semibold"
                  />
                </div>

                <div>
                  <FormLabel text="Kecamatan" required />
                  <Select
                    placeholder="Pilih kecamatan"
                    value={eventForm.district || undefined}
                    onChange={(value) =>
                      handleEventFormChange("district", value)
                    }
                    className="!w-full !h-[42px] [&_.ant-select-selector]:!rounded-lg text-slate-500 font-semibold"
                    options={[
                      { label: "Bantar Gebang", value: "Bantar Gebang" },
                      { label: "Bekasi Barat", value: "Bekasi Barat" },
                      { label: "Bekasi Selatan", value: "Bekasi Selatan" },
                      { label: "Bekasi Timur", value: "Bekasi Timur" },
                      { label: "Bekasi Utara", value: "Bekasi Utara" },
                      { label: "Jatiasih", value: "Jatiasih" },
                      { label: "Jatisampurna", value: "Jatisampurna" },
                      { label: "Medan Satria", value: "Medan Satria" },
                      { label: "Mustika Jaya", value: "Mustika Jaya" },
                      { label: "Pondok Gede", value: "Pondok Gede" },
                      { label: "Pondok Melati", value: "Pondok Melati" },
                      { label: "Rawalumbu", value: "Rawalumbu" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel text="Latitude" required />
                    <Input
                      type="number"
                      placeholder="Contoh: -6.23456"
                      value={eventForm.latitude ?? ""}
                      onChange={(e) =>
                        handleEventFormChange(
                          "latitude",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                      className="!rounded-lg !py-2.5 !border-gray-200 text-slate-500 font-semibold"
                    />
                  </div>
                  <div>
                    <FormLabel text="Longitude" required />
                    <Input
                      type="number"
                      placeholder="Contoh: 107.12345"
                      value={eventForm.longitude ?? ""}
                      onChange={(e) =>
                        handleEventFormChange(
                          "longitude",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                      className="!rounded-lg !py-2.5 !border-gray-200 text-slate-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <FormLabel text="Deskripsi Event" required />
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white custom-editor">
                    <ReactQuill
                      theme="snow"
                      value={eventForm.description}
                      onChange={(val) =>
                        handleEventFormChange("description", val)
                      }
                      modules={modules}
                      placeholder="Ketik deskripsi event kamu di sini..."
                    />
                    <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-[11px] text-slate-400 text-right">
                      {eventForm.description.replace(/<[^>]*>/g, "").length}{" "}
                      characters
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-5">
                <p className="text-xs text-slate-500 font-medium">
                  Informasi Kontak Yang Dapat Dihubungi
                </p>
                <h2 className="text-lg font-bold text-slate-800">
                  Informasi Narahubung
                </h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <FormLabel text="Nama" required />
                  <Input
                    placeholder="Masukkan nama narahubungmu"
                    value={eventForm.contactName}
                    onChange={(e) =>
                      handleEventFormChange("contactName", e.target.value)
                    }
                    className="!rounded-lg !py-2 text-sm text-slate-500 font-semibold"
                  />
                </div>
                <div>
                  <FormLabel text="Email" required />
                  <Input
                    placeholder="Masukkan email narahubungmu"
                    value={eventForm.contactEmail}
                    onChange={(e) =>
                      handleEventFormChange("contactEmail", e.target.value)
                    }
                    className="!rounded-lg !py-2 text-sm text-slate-500 font-semibold"
                  />
                </div>
                <div>
                  <FormLabel text="Nomor Ponsel" required />
                  <Input
                    addonBefore="+62"
                    placeholder="Contoh: 81315020525"
                    value={eventForm.contactPhone}
                    onChange={(e) =>
                      handleEventFormChange("contactPhone", e.target.value)
                    }
                    className="!rounded-lg text-sm text-slate-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-5">
                <p className="text-xs text-slate-400 font-medium">
                  Informasi Pengaturan Tambahan
                </p>
                <h2 className="text-lg font-bold text-slate-800">
                  Pengaturan Tambahan
                </h2>
              </div>
              <div className="flex items-center justify-between mb-4">
                <FormLabel
                  text="Batasan Transaksi per Akun"
                  subtext="Membatasi setiap email hanya bisa melakukan satu kali transaksi."
                />
                <Switch
                  checked={eventForm.limitPerEmail}
                  onChange={(checked) =>
                    handleEventFormChange("limitPerEmail", checked)
                  }
                  className="bg-gray-300 [&.ant-switch-checked]:bg-blue-600"
                />
              </div>

              {eventForm.limitPerEmail && (
                <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
                  <FormLabel
                    text="Jumlah Maksimal Tiket"
                    subtext="Batas tiket per transaksi."
                  />
                  <InputNumber
                    min={1}
                    value={eventForm.maxTicketsPerTransaction}
                    onChange={(val) =>
                      handleEventFormChange(
                        "maxTicketsPerTransaction",
                        val || 1,
                      )
                    }
                    className="!rounded-lg !w-20 text-center"
                  />
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-5">
                <p className="text-xs text-slate-400 font-medium">
                  Informasi Tiket
                </p>
                <h2 className="text-lg font-bold text-slate-800">
                  Kategori Tiket
                </h2>
              </div>

              <div className="space-y-4">
                {currentTickets.map((ticket, index) => (
                  <div
                    key={isNewEvent ? index : ticket.id}
                    className="border border-gray-200 rounded-xl p-4 relative overflow-hidden bg-white shadow-sm">
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-r border-gray-200"></div>
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-l border-gray-200"></div>

                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">
                          {ticket.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {ticket.description || "Informasi Data Lapor Klaim"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold text-[#7C3AED] uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"></div>
                        {ticket.isFree ? "Gratis" : "Berbayar"}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3 font-medium flex items-center gap-1">
                      Tersedia {ticket.stock} slot tiket
                    </p>

                    <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
                      <span className="font-bold text-base text-slate-800">
                        {ticket.isFree || ticket.price === 0
                          ? "Gratis"
                          : `Rp ${ticket.price?.toLocaleString("id-ID")}`}
                      </span>
                      <div className="flex gap-3 text-xs font-semibold">
                        <button
                          onClick={() => {
                            setTicketForm({
                              ...ticket,
                              isFree: ticket.price === 0,
                            });
                            setEditingId(
                              isNewEvent ? index.toString() : ticket.id!,
                            );
                            setModalOpen(true);
                          }}
                          className="text-[#7C3AED] flex items-center gap-1 hover:underline cursor-pointer">
                          <HiOutlinePencil /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTicketModal({
                              open: true,
                              ticketId: isNewEvent
                                ? index.toString()
                                : ticket.id!,
                              ticketName: ticket.name,
                            });
                          }}
                          className="text-red-500 flex items-center gap-1 hover:underline cursor-pointer">
                          <HiOutlineTrash /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    resetTicketForm();
                    setModalOpen(true);
                  }}
                  className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-slate-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition cursor-pointer">
                  Tambah Tiket <HiOutlinePlus className="text-lg" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-12 mt-8">
            <div className="flex justify-end items-center gap-3 w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <Button
                className="!h-10 !px-8 !rounded-lg !border-gray-300 !text-slate-600 font-semibold"
                onClick={handleSaveDraft}
                loading={eventFormSubmitting}>
                Draf
              </Button>
              <Button
                type="primary"
                onClick={handleSaveEvent}
                loading={eventFormSubmitting}
                className="!h-10 !px-8 !rounded-lg !bg-[#7C3AED] hover:!bg-[#6D28D9] !font-bold !border-none">
                Buat
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // =====================================================================
        // HALAMAN KELOLA TIKET EXISTING EVENT
        // =====================================================================
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kelola Tiket Event
              </h1>
              <p className="text-gray-500 mt-1 font-medium">{event?.title}</p>
            </div>
            <Button
              type="primary"
              onClick={() => {
                resetTicketForm();
                setModalOpen(true);
              }}
              icon={<HiOutlinePlus className="text-[18px]" />}
              className="!h-10 !rounded-full !px-5 !bg-[#7C3AED] hover:!bg-[#6D28D9] !font-semibold !shadow-none !flex !items-center !gap-2">
              Tambah Tiket
            </Button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Table
              rowKey="id"
              dataSource={tickets}
              loading={loading}
              scroll={{ x: 800 }}
              pagination={false}
              columns={[
                {
                  title: "Nama Tiket",
                  dataIndex: "name",
                  key: "name",
                  render: (name) => (
                    <span className="font-semibold text-slate-500">{name}</span>
                  ),
                },
                {
                  title: "Stok Tersedia",
                  dataIndex: "stock",
                  key: "stock",
                  render: (stock) => (
                    <span className="font-semibold text-slate-500">
                      {stock} Tiket
                    </span>
                  ),
                },
                {
                  title: "Harga",
                  dataIndex: "price",
                  key: "price",
                  render: (price) => (
                    <span className="font-semibold text-slate-500">
                      {price === 0
                        ? "Gratis"
                        : `Rp ${price?.toLocaleString("id-ID")}`}
                    </span>
                  ),
                },
                {
                  title: "Aksi",
                  key: "action",
                  width: 180,
                  render: (_, record) => (
                    <Space size="middle">
                      <Button
                        onClick={() => {
                          setTicketForm({
                            ...record,
                            isFree: record.price === 0,
                          });
                          setEditingId(record.id!);
                          setModalOpen(true);
                        }}
                        icon={<HiOutlinePencil className="text-[16px]" />}
                        className="!h-9 !rounded-full !border-[#F1F5F9] !shadow-none !text-[#7C3AED] hover:!bg-purple-50 !font-semibold">
                        Edit
                      </Button>
                      <Button
                        onClick={() =>
                          setDeleteTicketModal({
                            open: true,
                            ticketId: record.id!,
                            ticketName: record.name,
                          })
                        }
                        icon={<HiOutlineTrash className="text-[16px]" />}
                        className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-red-500 hover:!bg-red-50 hover:!border-red-200 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center !font-semibold">
                        Delete
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}

      {/* =====================================================================
          SHARED MODAL TIKET
          ===================================================================== */}
      <Modal
        title={
          <span className="text-xl font-bold text-slate-800">
            {editingId ? "Edit Tiket" : "Tambah Tiket"}
          </span>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          resetTicketForm();
        }}
        footer={null}
        centered
        width={480}
        closeIcon={<span className="text-lg">✕</span>}>
        <div className="pt-2 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Jenis Tiket
            </label>
            <div className="flex bg-gray-50 p-1 rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setTicketForm((prev) => ({ ...prev, isFree: false }))
                }
                className={`flex-1 py-2 text-sm font-bold rounded-md transition cursor-pointer ${!ticketForm.isFree ? "bg-white text-[#7C3AED]  shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                Berbayar
              </button>
              <button
                type="button"
                onClick={() =>
                  setTicketForm((prev) => ({ ...prev, isFree: true }))
                }
                className={`flex-1 py-2 text-sm font-bold rounded-md transition  cursor-pointer ${ticketForm.isFree ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                Gratis
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Nama Tiket <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Presale 1, VIP"
                value={ticketForm.name}
                onChange={(e) =>
                  setTicketForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="!rounded-lg !py-2.5 !border-gray-200 !text-sm !font-semibold !text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  Jumlah Stok <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  min={1}
                  className="!w-full !rounded-lg !py-1.5 !border-gray-200 !text-sm !font-semibold !text-slate-500"
                  value={ticketForm.stock}
                  onChange={(val) =>
                    setTicketForm((prev) => ({ ...prev, stock: val || 0 }))
                  }
                />
              </div>
              {!ticketForm.isFree && (
                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                    Harga <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    prefix={<span className="text-slate-400 mr-1">Rp</span>}
                    min={0}
                    className="!w-full !rounded-lg !py-1.5 !border-gray-200 !text-sm !font-semibold !text-slate-500"
                    value={ticketForm.price}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      value ? parseInt(value.replace(/\$\s?|(,*)/g, ""), 10) : 0
                    }
                    onChange={(val) =>
                      setTicketForm((prev) => ({ ...prev, price: val || 0 }))
                    }
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Deskripsi
              </label>
              <Input.TextArea
                rows={4}
                placeholder="Fasilitas atau info khusus tiket ini..."
                value={ticketForm.description}
                onChange={(e) =>
                  setTicketForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="!rounded-lg !border-gray-200 !text-sm !font-semibold !text-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-dashed border-gray-200">
            <Button
              onClick={() => setModalOpen(false)}
              className="flex-1 !h-12 !rounded-xl !bg-[#F8F9FA] hover:!bg-gray-200 !text-slate-600 !border-none font-bold text-base">
              Batal
            </Button>
            <Button
              type="primary"
              loading={ticketSubmitting}
              onClick={handleTicketSubmit}
              className="flex-1 !h-12 !rounded-xl !bg-[#7C3AED] hover:!bg-[#6D28D9] !font-bold text-base !shadow-none !border-none">
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <DeleteModal
        open={deleteTicketModal.open}
        dataName={deleteTicketModal.ticketName}
        loading={ticketSubmitting}
        onCancel={() =>
          setDeleteTicketModal({ open: false, ticketId: null, ticketName: "" })
        }
        onDelete={() => {
          if (deleteTicketModal.ticketId) {
            handleDeleteTicket(deleteTicketModal.ticketId);
          }
        }}
      />

      <style jsx global>{`
        .custom-editor .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 12px;
        }
        .custom-editor .ql-container.ql-snow {
          border: none !important;
          min-height: 180px;
          font-family: inherit;
          font-size: 14px;
        }
        .custom-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: #cbd5e1;
        }
        .custom-editor .ql-editor {
          padding: 16px;
        }
      `}</style>
    </div>
  );
}
