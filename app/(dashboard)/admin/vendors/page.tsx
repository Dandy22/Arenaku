"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";

interface Vendor {
  id: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  user: { name: string; email: string; phone: string };
  venues: { id: string; name: string }[];
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchVendors = async () => {
    try {
      const url =
        filter === "ALL" ? "/admin/vendors" : `/admin/vendors?status=${filter}`;
      const res = await api.get(url);
      setVendors(res.data);
    } catch {
      message.error("Gagal memuat data vendor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [filter]);

  const handleStatus = async (id: string, status: "VERIFIED" | "REJECTED") => {
    try {
      await api.patch(`/admin/vendors/${id}`, { status });
      message.success(
        `Vendor berhasil di-${status === "VERIFIED" ? "verifikasi" : "reject"}`,
      );
      fetchVendors();
    } catch {
      message.error("Gagal update status vendor");
    }
  };

  const columns: ColumnsType<Vendor> = [
    {
      title: "Vendor",
      key: "vendor",
      render: (_, record) => (
        <div>
          <p className="font-medium text-gray-800">{record.user?.name}</p>
          <p className="text-xs text-gray-500">{record.user?.email}</p>
        </div>
      ),
    },
    {
      title: "No. HP",
      key: "phone",
      render: (_, record) => (
        <span className="text-gray-600">{record.user?.phone || "-"}</span>
      ),
    },
    {
      title: "Jumlah Venue",
      key: "venues",
      render: (_, record) => (
        <span className="font-medium">{record.venues?.length || 0} venue</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const map: Record<string, string> = {
          PENDING: "orange",
          VERIFIED: "green",
          REJECTED: "red",
        };
        return <Tag color={map[status]}>{status}</Tag>;
      },
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <div className="flex gap-2">
          {record.status === "PENDING" && (
            <>
              <Popconfirm
                title="Verifikasi vendor ini?"
                onConfirm={() => handleStatus(record.id, "VERIFIED")}
                okText="Verifikasi"
                cancelText="Batal">
                <Button size="small" type="primary" ghost>
                  Verifikasi
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject vendor ini?"
                onConfirm={() => handleStatus(record.id, "REJECTED")}
                okText="Reject"
                cancelText="Batal"
                okButtonProps={{ danger: true }}>
                <Button size="small" danger type="text">
                  Reject
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === "VERIFIED" && (
            <Popconfirm
              title="Reject vendor ini?"
              onConfirm={() => handleStatus(record.id, "REJECTED")}
              okText="Reject"
              cancelText="Batal"
              okButtonProps={{ danger: true }}>
              <Button size="small" danger type="text">
                Reject
              </Button>
            </Popconfirm>
          )}
          {record.status === "REJECTED" && (
            <Popconfirm
              title="Verifikasi ulang vendor ini?"
              onConfirm={() => handleStatus(record.id, "VERIFIED")}
              okText="Verifikasi"
              cancelText="Batal">
              <Button size="small" type="primary" ghost>
                Verifikasi
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">List Vendor</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola dan verifikasi vendor
          </p>
        </div>
        <Select
          value={filter}
          onChange={setFilter}
          style={{ width: 160 }}
          options={[
            { value: "ALL", label: "Semua Status" },
            { value: "PENDING", label: "Pending" },
            { value: "VERIFIED", label: "Verified" },
            { value: "REJECTED", label: "Rejected" },
          ]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Table
          columns={columns}
          dataSource={vendors}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} vendor`,
          }}
        />
      </div>
    </div>
  );
}
