"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tag,
  Tabs,
  Upload,
} from "antd";

import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiArrowLeft,
} from "react-icons/hi2";
import api from "@/lib/axios";

interface Field {
  id: string;
  name: string;
  type: string;
  floorType: string;
  length: number;
  width: number;
  price: number;
  description: string;
}

interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
  description: string;
  fields: Field[];
  images: { id: string; url: string }[];
}

export default function VendorVenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params.id as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldModal, setFieldModal] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageModal, setImageModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fieldForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const fetchVenue = async () => {
    try {
      const res = await api.get(`/venues/${venueId}`);
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
    fieldForm.resetFields();
    setFieldModal(true);
  };

  const openEditField = (field: Field) => {
    setEditField(field);

    fieldForm.setFieldsValue({
      ...field,
      length: Number(field.length),
      width: Number(field.width),
      price: Number(field.price),
    });

    setFieldModal(true);
  };

  const handleFieldSubmit = async () => {
    try {
      const values = await fieldForm.validateFields();

      const payload = {
        ...values,
        length: Number(values.length),
        width: Number(values.width),
        price: Number(values.price),
      };

      setSubmitting(true);

      if (editField) {
        await api.patch(`/fields/${editField.id}`, payload);
        message.success("Lapangan berhasil diupdate");
      } else {
        await api.post("/fields", {
          ...payload,
          venueId,
        });
        message.success("Lapangan berhasil ditambahkan");
      }

      setFieldModal(false);
      fieldForm.resetFields();
      fetchVenue();
    } catch (err: any) {
      if (err?.response?.data?.error) {
        message.error(err.response.data.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      await api.delete(`/fields/${id}`);
      message.success("Lapangan berhasil dihapus");
      fetchVenue();
    } catch {
      message.error("Gagal menghapus lapangan");
    }
  };

  const handleAddImage = async () => {
    if (!imageUrl) return;

    try {
      await api.post(`/venues/${venueId}/images`, {
        url: imageUrl,
      });

      message.success("Foto berhasil ditambahkan");
      setImageUrl("");
      setImageModal(false);
      fetchVenue();
    } catch {
      message.error("Gagal menambahkan foto");
    }
  };

  const handleUploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ISI_PRESET_KAMU");

    try {
      setUploading(true);

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/ISI_CLOUD_NAME_KAMU/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      console.log("CLOUDINARY RESPONSE:", data);

      if (!data.secure_url) {
        throw new Error(data.error?.message || "Upload gagal");
      }

      setImageUrl(data.secure_url);
      message.success("Foto berhasil diupload");
    } catch (err: any) {
      console.log(err);
      message.error(err.message || "Upload gagal");
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await api.delete(`/venues/${venueId}/images/${imageId}`);
      message.success("Foto berhasil dihapus");
      fetchVenue();
    } catch {
      message.error("Gagal menghapus foto");
    }
  };

  const fieldColumns: ColumnsType<Field> = [
    {
      title: "Nama Lapangan",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className="font-medium">{name}</span>,
    },
    {
      title: "Tipe",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: "Ukuran",
      key: "size",
      render: (_, record) => (
        <span>
          {record.length} x {record.width} m
        </span>
      ),
    },
    {
      title: "Harga/Jam",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <span className="font-semibold">
          Rp {Number(price).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<HiOutlinePencil size={14} />}
            onClick={() => openEditField(record)}>
            Edit
          </Button>

          <Popconfirm
            title="Hapus lapangan ini?"
            onConfirm={() => handleDeleteField(record.id)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<HiOutlineTrash size={14} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Memuat...</p>
      </div>
    );
  }

  if (!venue) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-3">
          <HiArrowLeft size={16} />
          Kembali
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{venue.name}</h1>

            <p className="text-gray-500 text-sm mt-1">
              {venue.city} · {venue.address}
            </p>
          </div>
        </div>
      </div>

      <Tabs
        defaultActiveKey="fields"
        items={[
          {
            key: "fields",
            label: "Lapangan",
            children: (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    Daftar Lapangan
                  </h2>

                  <Button
                    type="primary"
                    icon={<HiOutlinePlus size={16} />}
                    onClick={openCreateField}
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                      border: "none",
                    }}>
                    Tambah Lapangan
                  </Button>
                </div>

                <Table
                  columns={fieldColumns}
                  dataSource={venue.fields}
                  rowKey="id"
                  pagination={false}
                />
              </div>
            ),
          },
          {
            key: "images",
            label: "Foto Venue",
            children: (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    Gallery Foto
                  </h2>

                  <Button
                    type="primary"
                    icon={<HiOutlinePlus size={16} />}
                    onClick={() => setImageModal(true)}
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                      border: "none",
                    }}>
                    Tambah Foto
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {venue.images?.map((img) => (
                    <div
                      key={img.id}
                      className="relative group rounded-lg overflow-hidden aspect-video bg-gray-100">
                      <img
                        src={img.url}
                        alt="venue"
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Popconfirm
                          title="Hapus foto ini?"
                          onConfirm={() => handleDeleteImage(img.id)}
                          okText="Hapus"
                          cancelText="Batal"
                          okButtonProps={{ danger: true }}>
                          <Button
                            danger
                            size="small"
                            icon={<HiOutlineTrash size={14} />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  ))}

                  {(!venue.images || venue.images.length === 0) && (
                    <p className="text-gray-400 text-sm col-span-full">
                      Belum ada foto
                    </p>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* Modal tambah/edit lapangan */}
      <Modal
        title={editField ? "Edit Lapangan" : "Tambah Lapangan"}
        open={fieldModal}
        onOk={handleFieldSubmit}
        onCancel={() => setFieldModal(false)}
        okText={editField ? "Simpan" : "Tambah"}
        cancelText="Batal"
        confirmLoading={submitting}
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            border: "none",
          },
        }}>
        <Form form={fieldForm} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Nama Lapangan"
            rules={[
              {
                required: true,
                message: "Nama lapangan wajib diisi",
              },
            ]}>
            <Input placeholder="Contoh: Lapangan A" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Tipe Olahraga"
            rules={[
              {
                required: true,
                message: "Tipe olahraga wajib dipilih",
              },
            ]}>
            <Select placeholder="Pilih tipe">
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
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="floorType" label="Jenis Lantai">
            <Input placeholder="Contoh: Vinyl, Rumput Sintetis" />
          </Form.Item>

          <div className="flex gap-3">
            <Form.Item
              name="length"
              label="Panjang (m)"
              className="flex-1"
              rules={[
                {
                  required: true,
                  message: "Panjang wajib diisi",
                },
              ]}>
              <InputNumber className="w-full" min={1} placeholder="40" />
            </Form.Item>

            <Form.Item
              name="width"
              label="Lebar (m)"
              className="flex-1"
              rules={[
                {
                  required: true,
                  message: "Lebar wajib diisi",
                },
              ]}>
              <InputNumber className="w-full" min={1} placeholder="20" />
            </Form.Item>
          </div>

          <Form.Item
            name="price"
            label="Harga per Jam (Rp)"
            rules={[
              {
                required: true,
                message: "Harga wajib diisi",
              },
            ]}>
            <InputNumber className="w-full" min={0} placeholder="150000" />
          </Form.Item>

          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={3} placeholder="Deskripsi lapangan..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tambah foto */}
      <Modal
        title="Tambah Foto Venue"
        open={imageModal}
        onOk={handleAddImage}
        onCancel={() => setImageModal(false)}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={uploading}
        okButtonProps={{
          disabled: !imageUrl,
          style: {
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            border: "none",
          },
        }}>
        <div className="mt-4">
          <Upload
            beforeUpload={handleUploadImage}
            showUploadList={false}
            accept="image/*"
            maxCount={1}>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition">
              <PlusOutlined className="text-2xl mb-2" />
              <p className="text-sm text-gray-600">
                Klik atau drag foto ke sini
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</p>
            </div>
          </Upload>

          {imageUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Preview Foto</p>
              <img
                src={imageUrl}
                alt="preview"
                className="w-full h-48 object-cover rounded-xl"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
