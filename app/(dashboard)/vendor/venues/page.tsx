"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, Drawer, Form, Input, Select, Upload, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowUpTray,
} from "react-icons/hi2";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { BEKASI_DISTRICTS } from "@/lib/constants";
import DataTable from "@/components/reusable/DataTable";
import DeleteModal from "@/components/reusable/DeleteModal";

interface Venue {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  description: string;
  thumbnailUrl?: string;
  fields: { id: string }[];
}

export default function VendorVenuesPage() {
  const router = useRouter();

  // 1. Ambil keyword pencarian dari URL params
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    venueId: string | null;
  }>({
    open: false,
    venueId: null,
  });

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/venues/${id}`);
      message.success("Venue berhasil dihapus");
      fetchVenues(); // Refresh tabel setelah dihapus
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Gagal menghapus venue";
      message.error(errorMsg);
    } finally {
      setDeleteModal({ open: false, venueId: null });
    }
  };

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await api.get("/venues");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setVenues(data);
    } catch (err) {
      console.error(err);
      message.error("Gagal memuat daftar venue");
      setVenues([]); // Set empty array jika gagal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  // 2. Logic Filter: Menjalankan filter hanya kalau data atau keyword berubah
  const filteredVenues = useMemo(() => {
    if (!searchQuery) return venues;

    const query = searchQuery.toLowerCase();
    return venues.filter(
      (v) =>
        v.name?.toLowerCase().includes(query) ||
        v.district?.toLowerCase().includes(query) ||
        v.address?.toLowerCase().includes(query),
    );
  }, [venues, searchQuery]);

  const handleCustomUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.url;
      setThumbnailUrl(url);
      form.setFieldValue("thumbnailUrl", url);
      onSuccess("Ok");
      message.success("Foto berhasil diunggah");
    } catch (err) {
      onError(err);
      message.error("Gagal mengunggah foto");
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreate = () => {
    setEditVenue(null);
    setThumbnailUrl("");
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (venue: Venue) => {
    setEditVenue(venue);
    const currentThumb = venue.thumbnailUrl || "";
    setThumbnailUrl(currentThumb);
    form.setFieldsValue({
      ...venue,
      thumbnailUrl: currentThumb,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        city: "Kota Bekasi",
        thumbnailUrl: thumbnailUrl,
      };

      if (editVenue) {
        await api.patch(`/venues/${editVenue.id}`, payload);
        message.success("Venue berhasil diperbarui");
      } else {
        await api.post("/venues", payload);
        message.success("Venue berhasil ditambahkan");
      }

      setDrawerOpen(false);
      fetchVenues();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Gagal menyimpan data";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Venue> = [
    {
      title: "Nama Venue",
      key: "name",
      render: (_, r) => (
        <span className="font-semibold text-slate-500">{r.name}</span>
      ),
    },
    {
      title: "Kecamatan",
      key: "district",
      render: (_, r) => (
        <span className="font-medium text-slate-500">{r.district || "-"}</span>
      ),
    },
    {
      title: "Alamat",
      key: "address",
      render: (_, r) => (
        <span className="text-sm font-medium text-slate-500 truncate max-w-[200px] block">
          {r.address || "-"}
        </span>
      ),
    },
    {
      title: "Lapangan",
      key: "fields",
      render: (_, r) => (
        <span className="font-semibold text-slate-500">
          {r.fields?.length || 0} Unit
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      fixed: "right",
      align: "left",
      width: 320,
      render: (_, r) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => router.push(`/vendor/venues/${r.id}`)}
            icon={<HiOutlineClipboardDocumentList className="text-[18px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !px-4 !text-yellow-500 !font-semibold !shadow-none hover:!bg-yellow-100">
            Kelola
          </Button>
          <Button
            onClick={() => openEdit(r)}
            icon={<HiOutlinePencilSquare className="text-[18px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-[#7C3AED] !font-semibold hover:!bg-purple-50">
            Edit
          </Button>
          <Button
            onClick={() => setDeleteModal({ open: true, venueId: r.id })}
            icon={<HiOutlineTrash className="text-[18px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-red-500 !font-semibold hover:!bg-red-50">
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Venue Saya</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola informasi properti dan lapangan kamu
          </p>
        </div>
        <Button
          type="primary"
          icon={<HiOutlinePlus className="text-[18px]" />}
          onClick={openCreate}
          className="
            !h-10 !rounded-full !border-[#F1F5F9]   !text-white !font-semibold !shadow-none !bg-[#7C3AED]
            hover:!bg-[#612dbb] [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center
          ">
          Tambah Venue
        </Button>
      </div>

      <div className="bg-white !w-full rounded-2xl shadow-sm border border-gray-100 p-6">
        <DataTable
          columns={columns}
          dataSource={filteredVenues}
          isLoading={loading}
          totalData={filteredVenues.length}
          showSearch
          searchPlaceholder="Cari nama venue..."
        />
      </div>

      <Drawer
        title={
          <span className="text-xl font-bold text-slate-800">
            {editVenue ? "Edit Venue" : "Tambah Venue Baru"}
          </span>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width="450px"
        closeIcon={<span className="text-gray-400 text-xl font-bold">✕</span>}
        footer={
          <div className="flex gap-4 pt-2 pb-4">
            <Button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 !h-12 !rounded-xl !font-semibold">
              Batal
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              className="flex-1 !h-12 !rounded-xl !bg-[#7C3AED] !font-bold !border-none">
              {editVenue ? "Simpan Perubahan" : "Buat Venue"}
            </Button>
          </div>
        }>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="space-y-4">
          <Form.Item
            name="name"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Nama Venue <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Nama wajib diisi" }]}>
            <Input
              className="!rounded-lg !py-2.5"
              placeholder="Contoh: GOR Maju Jaya"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm font-semibold text-slate-500">
                Foto Utama (Thumbnail) <span className="text-red-500">*</span>
              </span>
            }
            required>
            <Upload
              name="file"
              showUploadList={false}
              customRequest={handleCustomUpload}
              accept="image/*"
              className="w-full [&>.ant-upload]:!w-full [&>.ant-upload]:!block">
              <div className="relative w-full h-48 bg-[#F5F3FF] rounded-xl border-2 border-dashed border-[#DDD6FE] overflow-hidden hover:border-[#7C3AED] transition-all cursor-pointer group">
                {thumbnailUrl ? (
                  <>
                    <img
                      src={thumbnailUrl}
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
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#7C3AED]"></div>
                      ) : (
                        <HiOutlineArrowUpTray className="text-xl text-[#7C3AED]" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#7C3AED]">
                      {uploadingImage
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

            <Form.Item
              name="thumbnailUrl"
              noStyle
              rules={[{ required: true, message: "Foto wajib diunggah" }]}>
              <Input type="hidden" />
            </Form.Item>
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Deskripsi <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Deskripsi wajib diisi" }]}>
            <Input.TextArea
              rows={4}
              className="!rounded-lg"
              placeholder="Ceritakan tentang venue ini..."
            />
          </Form.Item>

          <Form.Item
            name="district"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Kecamatan <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true }]}>
            <Select className="!h-11" placeholder="Pilih Kecamatan">
              {BEKASI_DISTRICTS.filter((d) => d.value).map((d) => (
                <Select.Option key={d.value} value={d.value}>
                  {d.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="address"
            label={
              <span className="text-sm font-semibold text-slate-500">
                Alamat Lengkap <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true }]}>
            <Input
              className="!rounded-lg !py-2.5"
              placeholder="Contoh: Jl. Sudirman No. 1"
            />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              name="latitude"
              label={
                <span className="text-sm font-semibold text-slate-500">
                  Latitude
                </span>
              }
              className="flex-1">
              <Input
                type="number"
                step="any"
                className="!rounded-lg !py-2.5"
                placeholder="-6.20"
              />
            </Form.Item>
            <Form.Item
              name="longitude"
              label={
                <span className="text-sm font-semibold text-slate-500">
                  Longitude
                </span>
              }
              className="flex-1">
              <Input
                type="number"
                step="any"
                className="!rounded-lg !py-2.5"
                placeholder="106.84"
              />
            </Form.Item>
          </div>
        </Form>
      </Drawer>

      <DeleteModal
        open={deleteModal.open}
        dataName={venues.find((v) => v.id === deleteModal.venueId)?.name}
        onCancel={() => setDeleteModal({ open: false, venueId: null })}
        onDelete={() =>
          deleteModal.venueId && handleDelete(deleteModal.venueId)
        }
      />
    </div>
  );
}
