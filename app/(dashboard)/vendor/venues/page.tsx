"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
} from "react-icons/hi2";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { BEKASI_DISTRICTS } from "@/lib/constants";

interface Venue {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  fields: { id: string }[];
  images: { url: string }[];
}

export default function VendorVenuesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchVenues = async () => {
    try {
      const res = await api.get("/venues");
      setVenues(res.data);
    } catch {
      message.error("Gagal memuat venue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const openCreate = () => {
    setEditVenue(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (venue: Venue) => {
    setEditVenue(venue);
    form.setFieldsValue(venue);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editVenue) {
        await api.patch(`/venues/${editVenue.id}`, values);
        message.success("Venue berhasil diupdate");
      } else {
        await api.post("/venues", values);
        message.success("Venue berhasil dibuat");
      }
      setModalOpen(false);
      fetchVenues();
    } catch (err: any) {
      if (err?.response?.data?.error) {
        message.error(err.response.data.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/venues/${id}`);
      message.success("Venue berhasil dihapus");
      fetchVenues();
    } catch {
      message.error("Gagal menghapus venue");
    }
  };

  const columns: ColumnsType<Venue> = [
    {
      title: "Nama Venue",
      key: "name",
      render: (_, r) => (
        <div className="flex items-center gap-3">
          {r.images?.[0]?.url ? (
            <img
              src={r.images[0].url}
              className="w-10 h-10 rounded-lg object-cover"
              alt={r.name}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
              {r.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-800">{r.name}</p>
            <p className="text-xs text-gray-500">{r.address || r.city}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Kota",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "Kecamatan",
      dataIndex: "district",
      key: "district",
    },
    {
      title: "Lapangan",
      key: "fields",
      render: (_, r) => (
        <Tag color="purple">{r.fields?.length || 0} lapangan</Tag>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, r) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<HiOutlineEye size={14} />}
            onClick={() => router.push(`/vendor/venues/${r.id}`)}>
            Kelola
          </Button>
          <Button
            size="small"
            icon={<HiOutlinePencil size={14} />}
            onClick={() => openEdit(r)}>
            Edit
          </Button>
          <Popconfirm
            title="Hapus venue ini?"
            onConfirm={() => handleDelete(r.id)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<HiOutlineTrash size={14} />} />
          </Popconfirm>
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
            Kelola semua venue milikmu
          </p>
        </div>
        <Button
          type="primary"
          icon={<HiOutlinePlus size={16} />}
          onClick={openCreate}
          style={{
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            border: "none",
          }}>
          Tambah Venue
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Table
          columns={columns}
          dataSource={venues}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editVenue ? "Edit Venue" : "Tambah Venue Baru"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editVenue ? "Simpan" : "Buat"}
        cancelText="Batal"
        confirmLoading={submitting}
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            border: "none",
          },
        }}>
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Nama Venue"
            rules={[{ required: true, message: "Nama venue wajib diisi" }]}>
            <Input placeholder="Contoh: GOR Maju Jaya" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Deskripsi"
            rules={[{ required: true, message: "Deskripsi wajib diisi" }]}>
            <Input.TextArea rows={3} placeholder="Deskripsi venue..." />
          </Form.Item>
          <Form.Item name="city" label="Kota" initialValue="Kota Bekasi">
            <Input placeholder="Kota Bekasi" disabled />
          </Form.Item>
          <Form.Item
            name="district"
            label="Kecamatan"
            rules={[{ required: true, message: "Kecamatan wajib diisi" }]}>
            <Select placeholder="Pilih Kecamatan">
              {BEKASI_DISTRICTS.filter((d) => d.value).map((d) => (
                <Select.Option key={d.value} value={d.value}>
                  {d.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="address" label="Alamat Lengkap">
            <Input placeholder="Contoh: Jl. Sudirman No. 1" />
          </Form.Item>
          <div className="flex gap-3">
            <Form.Item name="latitude" label="Latitude" className="flex-1">
              <Input placeholder="-6.2088" type="number" />
            </Form.Item>
            <Form.Item name="longitude" label="Longitude" className="flex-1">
              <Input placeholder="106.8456" type="number" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
