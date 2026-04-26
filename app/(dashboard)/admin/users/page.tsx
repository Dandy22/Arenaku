"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message, Badge } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch {
      message.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSuspend = async (id: string, isSuspended: boolean) => {
    try {
      await api.patch(`/users/${id}`, { isSuspended: !isSuspended });
      message.success(
        isSuspended ? "User berhasil diaktifkan" : "User berhasil disuspend",
      );
      fetchUsers();
    } catch {
      message.error("Gagal update status user");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      message.success("User berhasil dihapus");
      fetchUsers();
    } catch {
      message.error("Gagal menghapus user");
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <p className="font-medium text-gray-800">{name}</p>
          <p className="text-xs text-gray-500">{record.email}</p>
        </div>
      ),
    },
    {
      title: "No. HP",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => <span className="text-gray-600">{phone || "-"}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const map: Record<string, { color: string; label: string }> = {
          ADMIN: { color: "purple", label: "Admin" },
          VENDOR: { color: "blue", label: "Vendor" },
          CUSTOMER: { color: "green", label: "Customer" },
        };
        return <Tag color={map[role]?.color}>{map[role]?.label || role}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "isSuspended",
      key: "isSuspended",
      render: (isSuspended) => (
        <Badge
          status={isSuspended ? "error" : "success"}
          text={isSuspended ? "Suspended" : "Aktif"}
        />
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <div className="flex gap-2">
          <Popconfirm
            title={
              record.isSuspended ? "Aktifkan user ini?" : "Suspend user ini?"
            }
            onConfirm={() => handleSuspend(record.id, record.isSuspended)}
            okText="Ya"
            cancelText="Tidak">
            <Button
              size="small"
              type={record.isSuspended ? "primary" : "default"}
              danger={!record.isSuspended}>
              {record.isSuspended ? "Aktifkan" : "Suspend"}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Hapus user ini secara permanen?"
            onConfirm={() => handleDelete(record.id)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}>
            <Button size="small" danger type="text">
              Hapus
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">List User</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola semua pengguna sistem
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} user`,
          }}
        />
      </div>
    </div>
  );
}
