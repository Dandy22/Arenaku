"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Table,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Tabs,
  Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiArrowLeft,
  HiOutlineArrowUpTray,
  HiXMark,
} from "react-icons/hi2";
import api from "@/lib/axios";
import DeleteModal from "@/components/reusable/DeleteModal";

interface Field {
  id: string;
  name: string;
  type: string;
  floorType: string;
  length: number;
  width: number;
  price: number;
  description: string;
  thumbnailUrl?: string;
  images?: { id?: string; url: string; title: string }[];
}

interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
  description: string;
  district: string;
  fields: Field[];
  images: { id: string; url: string; title?: string }[];
}

export default function VendorVenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params.id as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  const [fieldDrawer, setFieldDrawer] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);
  const [fieldThumbnailUrl, setFieldThumbnailUrl] = useState("");
  const [uploadingFieldThumb, setUploadingFieldThumb] = useState(false);

  const [imageDrawer, setImageDrawer] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [fieldForm] = Form.useForm();
  const [imageForm] = Form.useForm();

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: string | null;
    name: string;
    type: "FIELD" | "IMAGE";
  }>({
    open: false,
    id: null,
    name: "",
    type: "FIELD",
  });

  const fetchVenue = async () => {
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/venues/${venueId}?t=${timestamp}`);

      setVenue(res.data);
    } catch {
      message.error("Gagal memuat venue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenue();
  }, [venueId]);

  const openCreateField = () => {
    setEditField(null);
    setFieldThumbnailUrl("");
    fieldForm.resetFields();
    setFieldDrawer(true);
  };

  const openEditField = (field: Field) => {
    setEditField(field);
    const thumbUrl = field.thumbnailUrl || "";
    setFieldThumbnailUrl(thumbUrl);
    setFieldDrawer(true);

    setTimeout(() => {
      fieldForm.setFieldsValue({
        name: field.name,
        type: field.type,
        floorType: field.floorType,
        length: Number(field.length),
        width: Number(field.width),
        price: Number(field.price),
        description: field.description,
        images:
          field.images?.map((img) => ({ url: img.url, title: img.title })) ||
          [],
      });
    }, 100);
  };

  // ✅ UPLOAD HANDLER - HANYA UPDATE STATE
  const handleUploadFieldThumbnail = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingFieldThumb(true);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data.url;
      if (!url) throw new Error("URL tidak ditemukan di response");

      // ✅ UPDATE STATE - INI YANG PENTING
      setFieldThumbnailUrl(url);
      // ✅ ALSO SET FORM VALUE (fallback jika dibutuhkan)
      fieldForm.setFieldValue("thumbnailUrl", url);

      onSuccess("Ok");
      message.success("✅ Thumbnail lapangan berhasil diunggah");
    } catch (err: any) {
      console.error("Upload error:", err);
      onError(err);
      message.error("❌ Upload gagal");
    } finally {
      setUploadingFieldThumb(false);
    }
  };

  // ✅ SUBMIT HANDLER - VALIDASI MANUAL THUMBNAIL
  const handleFieldSubmit = async () => {
    try {
      const values = await fieldForm.validateFields();

      // ✅ VALIDASI THUMBNAIL SECARA MANUAL
      if (!fieldThumbnailUrl) {
        message.error("❌ Foto lapangan wajib diunggah!");
        return;
      }

      const payload = {
        ...values,
        thumbnailUrl: fieldThumbnailUrl,
      };

      setSubmitting(true);

      if (editField) {
        // 1. Tembak API Patch
        await api.patch(`/fields/${editField.id}`, payload);
        message.success("✅ Lapangan berhasil diperbarui");
        setVenue((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            fields: prev.fields.map((f) =>
              f.id === editField.id ? { ...f, ...payload } : f,
            ),
          };
        });
      } else {
        await api.post("/fields", { ...payload, venueId });
        message.success("✅ Lapangan berhasil ditambahkan");
        await fetchVenue(); // 👈 Tambahin await di sini
      }

      setFieldDrawer(false);
      setFieldThumbnailUrl("");
      fieldForm.resetFields();
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      const errorMsg = err.response?.data?.error || "Gagal menyimpan data";
      message.error(`❌ ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImage = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res.data.url) throw new Error("URL tidak ditemukan");

      setImageUrl(res.data.url);
      imageForm.setFieldValue("url", res.data.url);
      onSuccess("Ok");
      message.success("Foto berhasil diunggah");
    } catch (err: any) {
      console.log(err);
      onError(err);
      message.error(err.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveImage = async () => {
    try {
      const values = await imageForm.validateFields();

      if (!imageUrl) {
        message.error("Mohon tunggu sampai foto selesai diunggah");
        return;
      }

      setSubmitting(true);

      await api.post(`/venues/${venueId}/images`, {
        url: imageUrl,
        title: values.title,
      });

      message.success("Foto berhasil ditambahkan ke galeri");
      setImageDrawer(false);
      imageForm.resetFields();
      setImageUrl("");
      fetchVenue();
    } catch (err: any) {
      console.error("Gagal simpan galeri:", err);
      if (err?.response?.data?.error) {
        message.error(err.response.data.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    setSubmitting(true);
    try {
      if (deleteModal.type === "FIELD") {
        await api.delete(`/fields/${deleteModal.id}`);
        message.success("Lapangan berhasil dihapus");
      } else if (deleteModal.type === "IMAGE") {
        await api.delete(`/venues/${venueId}/images/${deleteModal.id}`);
        message.success("Foto berhasil dihapus");
      }
      fetchVenue();
    } catch {
      message.error("Gagal menghapus data");
    } finally {
      setSubmitting(false);
      setDeleteModal({ open: false, id: null, name: "", type: "FIELD" });
    }
  };

  const fieldColumns: ColumnsType<Field> = [
    {
      title: "Nama Lapangan",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className="font-semibold text-sm text-slate-500">{name}</span>
      ),
    },
    {
      title: "Tipe",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <div className="inline-flex items-center px-2.5 py-1 rounded-md text-slate-500 text-xs font-bold uppercase tracking-wider">
          {type.replace("_", " ")}
        </div>
      ),
    },
    {
      title: "Ukuran",
      key: "size",
      render: (_, record) => (
        <span className="font-medium text-slate-500">
          {record.length} x {record.width} m
        </span>
      ),
    },
    {
      title: "Harga/Jam",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <span className="font-semibold text-slate-500">
          Rp {Number(price).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <div className="flex gap-2 items-center">
          <Button
            onClick={() => openEditField(record)}
            icon={<HiOutlinePencil className="text-[16px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-[#7C3AED] hover:!bg-purple-50 hover:!border-purple-200 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center !font-semibold">
            Edit
          </Button>

          <Button
            onClick={() =>
              setDeleteModal({
                open: true,
                id: record.id,
                name: record.name,
                type: "FIELD",
              })
            }
            icon={<HiOutlineTrash className="text-[16px] !text-red-500" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-red-500 hover:!bg-red-50 hover:!border-red-200 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center !font-semibold">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 font-medium">Memuat data venue...</p>
      </div>
    );
  }

  if (!venue) return null;

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-800 font-semibold text-sm mb-4 transition">
          <HiArrowLeft className="text-lg" />
          Kembali
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">{venue.name}</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {venue.city} <span className="mx-1">•</span> {venue.district}{" "}
            <span className="mx-1">•</span> {venue.address}
          </p>
        </div>
      </div>

      {/* TABS */}
      <Tabs
        defaultActiveKey="fields"
        items={[
          {
            key: "fields",
            label: <span className="font-semibold px-2">Daftar Lapangan</span>,
            children: (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-2">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-gray-800">
                    Lapangan Tersedia
                  </h2>
                  <Button
                    type="primary"
                    icon={<HiOutlinePlus className="text-[18px]" />}
                    onClick={openCreateField}
                    className="!h-10 !rounded-full !border-[#F1F5F9] !px-4 !text-white !font-semibold !shadow-none !bg-[#7C3AED] hover:!bg-[#612dbb] [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center">
                    Tambah Lapangan
                  </Button>
                </div>

                <Table
                  columns={fieldColumns}
                  dataSource={venue.fields}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 700 }}
                />
              </div>
            ),
          },
          {
            key: "images",
            label: <span className="font-semibold px-2">Galeri Foto</span>,
            children: (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-2">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-gray-800">
                    Foto Venue
                  </h2>
                  <Button
                    type="primary"
                    icon={<HiOutlinePlus className="text-[18px]" />}
                    onClick={() => {
                      setImageUrl("");
                      imageForm.resetFields();
                      setImageDrawer(true);
                    }}
                    className="!h-10 !rounded-full !px-5 !bg-[#7C3AED] hover:!bg-[#6D28D9] !font-semibold !shadow-none !flex !items-center !gap-2">
                    Unggah Foto
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {venue.images?.map((img) => (
                    <div key={img.id} className="flex flex-col gap-2 group">
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-50 border border-gray-100">
                        <img
                          src={img.url}
                          alt="venue"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <Button
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                id: img.id,
                                name: img.title || "Foto Galeri",
                                type: "IMAGE",
                              })
                            }
                            danger
                            size="small"
                            icon={<HiOutlineTrash size={16} />}
                            className="!flex !items-center !justify-center !rounded-full !w-10 !h-10"
                          />
                        </div>
                      </div>
                      <span className="text-slate-500 font-semibold text-sm px-1 truncate">
                        {img.title || "Foto Venue"}
                      </span>
                    </div>
                  ))}

                  {(!venue.images || venue.images.length === 0) && (
                    <div className="col-span-full py-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                      <p className="text-slate-400 font-medium text-sm">
                        Belum ada foto yang diunggah
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* DRAWER: TAMBAH/EDIT LAPANGAN */}
      <Drawer
        title={
          <span className="text-xl font-bold text-slate-800">
            {editField ? "Edit Lapangan" : "Tambah Lapangan"}
          </span>
        }
        placement="right"
        onClose={() => setFieldDrawer(false)}
        open={fieldDrawer}
        width={480}
        destroyOnClose
        closeIcon={<span className="text-gray-400 text-xl font-bold">✕</span>}
        footer={
          <div className="flex gap-4 pt-2 pb-4 px-2">
            <Button
              onClick={() => setFieldDrawer(false)}
              className="flex-1 !h-12 !rounded-xl !border-slate-200 hover:!bg-gray-200 !text-slate-500 !font-semibold !text-base">
              Batal
            </Button>
            <Button
              type="primary"
              onClick={handleFieldSubmit}
              loading={submitting}
              className="flex-1 !h-12 !rounded-xl !bg-[#7C3AED] hover:!bg-[#6D28D9] !font-bold text-base !shadow-none !border-none">
              {editField ? "Simpan Perubahan" : "Tambah Lapangan"}
            </Button>
          </div>
        }>
        <Form
          form={fieldForm}
          layout="vertical"
          requiredMark={false}
          className="space-y-4 mt-2">
          {/* ✅ FIX: UPLOAD TANPA name, VALIDASI MANUAL */}
          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-500">
                Thumbnail Lapangan <span className="text-red-500">*</span>
              </span>
            }
            className="mb-0">
            <Upload
              name="file"
              showUploadList={false}
              customRequest={handleUploadFieldThumbnail}
              accept="image/*"
              className="w-full [&>.ant-upload]:!w-full [&>.ant-upload]:!block">
              <div className="relative w-full h-48 bg-[#F5F3FF] rounded-xl border-2 border-dashed border-[#DDD6FE] overflow-hidden hover:border-[#7C3AED] transition-all cursor-pointer group">
                {fieldThumbnailUrl ? (
                  <>
                    <img
                      src={fieldThumbnailUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center text-white">
                        <HiOutlineArrowUpTray className="text-2xl mb-1" />
                        <span className="text-xs font-medium">Ganti Foto</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 bg-[#EEDEFF] rounded-lg flex items-center justify-center mb-3">
                      {uploadingFieldThumb ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#7C3AED]"></div>
                      ) : (
                        <HiOutlineArrowUpTray className="text-xl text-[#7C3AED]" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#7C3AED]">
                      {uploadingFieldThumb
                        ? "Mengunggah..."
                        : "Klik untuk unggah foto"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PNG, JPG, WEBP (Max 2MB)
                    </p>
                  </div>
                )}
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="name"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Nama Lapangan <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Nama lapangan wajib diisi" }]}
            className="mb-0">
            <Input
              className="!rounded-lg !py-2 !border-gray-200 !font-semibold !text-slate-500"
              placeholder="Contoh: Lapangan A"
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Tipe Olahraga <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Tipe olahraga wajib dipilih" }]}
            className="mb-0">
            <Select
              className="!w-full [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-gray-200 !py-[10px] !font-semibold !text-slate-500 [&_.ant-select-selector]:!h-auto"
              placeholder="Pilih tipe olahraga">
              {[
                "FUTSAL",
                "BADMINTON",
                "BASKETBALL",
                "TENNIS",
                "MINI_SOCCER",
                "VOLLEYBALL",
                "PADEL",
              ].map((type) => (
                <Select.Option key={type} value={type}>
                  {type.replace("_", " ")}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="floorType"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Jenis Lantai
              </span>
            }
            className="mb-0">
            <Input
              className="!rounded-lg !py-2 !border-gray-200 !font-semibold !text-slate-500"
              placeholder="Contoh: Vinyl, Rumput Sintetis"
            />
          </Form.Item>

          <div className="flex gap-4 !mb-0">
            <Form.Item
              name="length"
              label={
                <span className="text-sm font-semibold text-slate-500">
                  Panjang (m) <span className="text-red-500">*</span>
                </span>
              }
              className="flex-1 mb-0"
              rules={[{ required: true, message: "Wajib diisi" }]}>
              <InputNumber
                className="!w-full !rounded-lg !py-1 !border-gray-200 !font-semibold !text-slate-500"
                min={1}
                placeholder="40"
              />
            </Form.Item>

            <Form.Item
              name="width"
              label={
                <span className="text-sm font-semibold text-slate-500">
                  Lebar (m) <span className="text-red-500">*</span>
                </span>
              }
              className="flex-1 mb-0"
              rules={[{ required: true, message: "Wajib diisi" }]}>
              <InputNumber
                className="!w-full !rounded-lg !py-1 !border-gray-200 !font-semibold !text-slate-500"
                min={1}
                placeholder="20"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="price"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Harga per Jam (Rp) <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Harga wajib diisi" }]}
            className="mb-0">
            <InputNumber<number>
              className="!w-full !rounded-lg !py-2 !border-gray-200 !font-semibold !text-slate-500"
              min={0}
              placeholder="150000"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                value ? Number(value.replace(/\$\s?|(,*)/g, "")) : 0
              }
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Deskripsi
              </span>
            }
            className="mb-0">
            <Input.TextArea
              className="!rounded-lg !py-2.5 !border-gray-200 !font-semibold !text-slate-500"
              rows={3}
              placeholder="Ketik deskripsi lapangan..."
            />
          </Form.Item>

          {/* GALERI LAPANGAN - FIX PADDING & LAYOUT */}
          <div className="pt-4 mt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Galeri Lapangan (Opsional, Maks. 4)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tambahkan foto detail lapangan seperti Area Bench, Kondisi Lantai,
              dll.
            </p>

            <Form.List
              name="images"
              rules={[
                {
                  validator: async (_, images) => {
                    if (images && images.length > 4) {
                      return Promise.reject(
                        new Error("Maksimal hanya 4 foto galeri"),
                      );
                    }
                  },
                },
              ]}>
              {(fields, { add, remove }, { errors }) => (
                <div className="space-y-4">
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-200 relative  mt-2">
                      <button
                        type="button"
                        onClick={() => remove(name)}
                        className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-50 hover:text-red-600 cursor-pointer z-10 shadow-sm font-bold text-sm transition-all">
                        <HiXMark className="text-[14px]" />
                      </button>

                      {/* BOX GAMBAR */}
                      <div className="w-24 shrink-0">
                        <div className="text-sm font-semibold mb-2 invisible">
                          Foto
                        </div>

                        {/* ✅ 1. Form.Item disembunyikan agar hanya menyimpan teks URL */}
                        <Form.Item
                          {...restField}
                          name={[name, "url"]}
                          rules={[{ required: true, message: "Pilih foto" }]}
                          className="hidden">
                          <Input />
                        </Form.Item>

                        {/* ✅ 2. Upload ditaruh DI LUAR Form.Item agar tidak menimpa nilai form dengan Object */}
                        <Upload
                          name="file"
                          showUploadList={false}
                          customRequest={async (options: any) => {
                            const { file, onSuccess, onError } = options;
                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                              const res = await api.post("/upload", formData, {
                                headers: {
                                  "Content-Type": "multipart/form-data",
                                },
                              });
                              const currentImages =
                                fieldForm.getFieldValue("images") || [];
                              currentImages[name] = {
                                ...currentImages[name],
                                url: res.data.url, // Kita set teks URL-nya
                              };
                              fieldForm.setFieldsValue({
                                images: currentImages,
                              });
                              onSuccess("Ok");
                            } catch (err) {
                              onError(err);
                              message.error("Gagal unggah foto galeri");
                            }
                          }}
                          accept="image/*">
                          <div className="w-24 h-24 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 overflow-hidden relative group">
                            <Form.Item
                              noStyle
                              shouldUpdate={(prevValues, currentValues) =>
                                prevValues.images?.[name]?.url !==
                                currentValues.images?.[name]?.url
                              }>
                              {({ getFieldValue }) => {
                                const imgUrl = getFieldValue([
                                  "images",
                                  name,
                                  "url",
                                ]);

                                // ✅ 3. Pastikan yang dirender benar-benar string URL
                                return imgUrl && typeof imgUrl === "string" ? (
                                  <>
                                    <img
                                      src={imgUrl}
                                      alt="preview"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex flex-col items-center text-white">
                                        <HiOutlineArrowUpTray className="text-xl mb-0.5" />
                                        <span className="text-[10px] font-medium leading-tight text-center">
                                          Ganti
                                          <br />
                                          Foto
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <HiOutlineArrowUpTray className="text-xl text-slate-400" />
                                );
                              }}
                            </Form.Item>
                          </div>
                        </Upload>
                      </div>

                      {/* BOX TEKS */}
                      <div className="flex-1">
                        <Form.Item
                          {...restField}
                          name={[name, "title"]}
                          label={
                            <span className="text-sm font-semibold text-slate-500">
                              Nama Foto
                            </span>
                          }
                          rules={[
                            {
                              required: true,
                              message: "Wajib diisi",
                            },
                          ]}
                          className="mb-0">
                          <Input
                            placeholder="Contoh: Area Bench"
                            className="!rounded-lg !py-2 !border-gray-200 !text-sm"
                          />
                        </Form.Item>
                      </div>
                    </div>
                  ))}

                  {fields.length < 4 && (
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<HiOutlinePlus />}
                      className="!h-10 !rounded-xl !border-purple-200 !text-purple-600 hover:!bg-purple-50 hover:!border-purple-400">
                      Tambah Foto Galeri Lapangan
                    </Button>
                  )}
                  <Form.ErrorList
                    errors={errors}
                    className="text-red-500 text-sm mt-2"
                  />
                </div>
              )}
            </Form.List>
          </div>
        </Form>
      </Drawer>

      {/* DRAWER: UPLOAD FOTO GALERI */}
      <Drawer
        title={
          <span className="text-xl font-bold text-slate-800">
            Unggah Foto Galeri
          </span>
        }
        placement="right"
        onClose={() => {
          setImageDrawer(false);
          setImageUrl("");
          imageForm.resetFields();
        }}
        open={imageDrawer}
        width={450}
        destroyOnClose
        closeIcon={<span className="text-gray-400 text-xl font-bold">✕</span>}
        footer={
          <div className="flex gap-4 pt-2 pb-4 px-2">
            <Button
              onClick={() => {
                setImageDrawer(false);
                setImageUrl("");
                imageForm.resetFields();
              }}
              className="flex-1 !h-12 !rounded-xl !border-slate-200 hover:!bg-gray-200 !text-slate-500 !font-semibold !text-base">
              Batal
            </Button>
            <Button
              type="primary"
              onClick={handleSaveImage}
              loading={submitting}
              className="flex-1 !h-12 !rounded-xl !bg-[#7C3AED] hover:!bg-[#6D28D9] !font-bold text-base !shadow-none !border-none">
              Simpan Foto
            </Button>
          </div>
        }>
        <Form
          form={imageForm}
          layout="vertical"
          requiredMark={false}
          className="space-y-4 mt-2">
          <Form.Item
            name="title"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Nama Foto <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Nama foto wajib diisi" }]}
            className="mb-0">
            <Input
              className="!rounded-lg !py-2.5 !border-gray-200 font-semibold text-slate-500"
              placeholder="Contoh: ARENA A"
            />
          </Form.Item>

          <Form.Item
            name="url"
            label={
              <span className="text-sm font-semibold text-slate-500">
                File Foto Venue <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Foto wajib diunggah" }]}
            className="mb-0">
            <Upload
              name="file"
              showUploadList={false}
              customRequest={handleUploadImage}
              accept="image/*"
              className="w-full [&>.ant-upload]:!w-full [&>.ant-upload]:!block">
              <div className="relative w-full h-48 bg-[#F5F3FF] rounded-xl border-2 border-dashed border-[#DDD6FE] overflow-hidden hover:border-[#7C3AED] transition-all cursor-pointer group">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center text-white">
                        <HiOutlineArrowUpTray className="text-2xl mb-1" />
                        <span className="text-xs font-medium">Ganti Foto</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 bg-[#EEDEFF] rounded-lg flex items-center justify-center mb-3">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#7C3AED]"></div>
                      ) : (
                        <HiOutlineArrowUpTray className="text-xl text-[#7C3AED]" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#7C3AED]">
                      {uploading ? "Mengunggah..." : "Klik untuk unggah foto"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PNG, JPG, WEBP (Max 2MB)
                    </p>
                  </div>
                )}
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>

      <DeleteModal
        open={deleteModal.open}
        loading={submitting}
        dataName={deleteModal.name}
        onCancel={() =>
          setDeleteModal({ open: false, id: null, name: "", type: "FIELD" })
        }
        onDelete={executeDelete}
      />
    </div>
  );
}
