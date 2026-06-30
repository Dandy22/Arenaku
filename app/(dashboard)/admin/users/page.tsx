"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, message, Select } from "antd";
import { HiEye, HiOutlineTrash } from "react-icons/hi2";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";

import DataTable from "@/components/reusable/DataTable";
import DeleteModal from "@/components/reusable/DeleteModal";
import AlertDialog from "@/components/reusable/AlertDialog";
import CustomDrawer from "@/components/reusable/CustomDrawer";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";

// Interface disesuaikan dengan Schema Prisma
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
  address: string;
  district: string;
  isSuspended: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  vendorMemberships?: {
    role: "OWNER" | "ADMIN" | "STAFF";
    vendor: {
      name: string;
      venues: { name: string }[];
    };
  }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    userId: string | null;
    userName: string;
  }>({ open: false, userId: null, userName: "" });

  const [actionModal, setActionModal] = useState<{
    open: boolean;
    userId: string | null;
    isSuspended: boolean;
  }>({ open: false, userId: null, isSuspended: false });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url =
        filter === "ALL" ? "/admin/users" : `/admin/users?role=${filter}`;
      const res = await api.get(url);
      setUsers(res.data);
    } catch {
      message.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.includes(query),
    );
  }, [users, searchQuery]);

  const handleSuspendToggle = async (id: string, isSuspended: boolean) => {
    try {
      await api.patch(`/admin/users/${id}`, { isSuspended: !isSuspended });
      message.success(isSuspended ? "User diaktifkan" : "User disuspend");
      setDrawerOpen(false);
      fetchUsers();
    } catch {
      message.error("Gagal update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      message.success("User berhasil dihapus");
      fetchUsers();
    } catch {
      message.error("Gagal menghapus user");
    }
  };

  // --- BADGES ---
  const roleBadge = (role: string, memberships?: User["vendorMemberships"]) => {
    const membership = memberships?.[0];
    const isStaff = membership?.role === "STAFF";
    const isVendorOwner = role === "VENDOR" && membership?.role === "OWNER";

    const map: Record<string, { text: string; className: string }> = {
      ADMIN: { text: "Admin", className: "text-purple-600 bg-purple-50" },
      VENDOR: { text: "Vendor Owner", className: "text-blue-600 bg-blue-50" },
      CUSTOMER: { text: "Customer", className: "text-green-600 bg-green-50" },
    };

    const item = map[role] || {
      text: role,
      className: "text-gray-600 bg-gray-50",
    };

    const label = isStaff
      ? `STAFF VENDOR`
      : isVendorOwner
        ? `VENDOR OWNER`
        : item.text;

    return (
      <div
        className={`inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
        <span>{label}</span>
      </div>
    );
  };

  const statusBadge = (isSuspended: boolean) => {
    const item = isSuspended
      ? { text: "Suspended", className: "text-red-500 bg-red-50" }
      : { text: "Aktif", className: "text-green-500 bg-green-50" };

    return (
      <div
        className={`inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
        <span>{item.text}</span>
      </div>
    );
  };

  const columns: ColumnsType<User> = [
    {
      title: "User ID",
      key: "id",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-500">
            #{r.id.slice(-8)}
          </span>
        </div>
      ),
    },
    {
      title: "Nama Lengkap",
      key: "name",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-500">{r.name}</span>
        </div>
      ),
    },
    {
      title: "Email",
      key: "email",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-500">
            {r.email}
          </span>
        </div>
      ),
    },
    {
      title: "Kontak",
      key: "contact",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-500">
            {r.phone || "-"}
          </span>
        </div>
      ),
    },
    {
      title: "Role Sistem",
      key: "role",
      render: (_, record) => roleBadge(record.role, record.vendorMemberships),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => statusBadge(record.isSuspended),
    },
    {
      title: "Bergabung",
      key: "createdAt",
      render: (_, r) => (
        <span className="text-sm font-medium text-slate-500">
          {dayjs(r.createdAt).format("DD MMM YYYY")}
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "left",
      render: (_, record) => (
        <div className="flex items-center justify-start gap-2">
          <Button
            onClick={() => {
              setSelectedUser(record);
              setDrawerOpen(true);
            }}
            icon={<HiEye size={18} />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !px-4 !text-blue-500 !font-semibold !shadow-none hover:!bg-blue-50">
            Detail
          </Button>
          <Button
            onClick={() =>
              setDeleteModal({
                open: true,
                userId: record.id,
                userName: record.name,
              })
            }
            icon={<HiOutlineTrash size={18} />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-red-500 hover:!bg-red-50 !font-semibold">
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const renderDrawerContent = () => {
    if (!selectedUser) return null;

    const membership = selectedUser.vendorMemberships?.[0];

    return (
      <div className="space-y-4 mt-2 pb-6">
        {/* --- PROFIL USER --- */}
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            Nama Lengkap
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedUser.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-2">Email</p>
            <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
              <p className="font-semibold text-sm text-slate-600 truncate">
                {selectedUser.email}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-2">
              No. Handphone
            </p>
            <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
              <p className="font-semibold text-sm text-slate-600">
                {selectedUser.phone || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* --- ROLE & JOIN DATA --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Informasi Sistem
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Role Utama
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                {roleBadge(selectedUser.role, selectedUser.vendorMemberships)}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Terdaftar Sejak
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {dayjs(selectedUser.createdAt).format("DD MMMM YYYY")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RELASI VENDOR --- */}
        {membership && (
          <div className="pt-4 border-t border-gray-100 mt-6">
            <p className="text-sm font-bold text-slate-700 mb-3">
              Relasi Vendor
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-2">
                  Bekerja di Vendor
                </p>
                <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                  <p className="font-semibold text-sm text-slate-600">
                    {membership.vendor.name}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 mb-2">
                  Venues yang Dikelola
                </p>
                <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200 min-h-[46px] flex items-center">
                  <div className="flex flex-wrap gap-2">
                    {membership.vendor.venues.length > 0 ? (
                      membership.vendor.venues.map((v, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50">
                          <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span>{v.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400 italic">
                        Belum ada venue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDrawerFooter = () => (
    <div className="flex items-center gap-3 w-full">
      <Button
        onClick={() => setDrawerOpen(false)}
        className="flex-1 !h-11 !rounded-lg !border-gray-300 hover:!bg-gray-50 !text-slate-600 !font-semibold !text-sm">
        Kembali
      </Button>

      {selectedUser && (
        <Button
          onClick={() =>
            setActionModal({
              open: true,
              userId: selectedUser.id,
              isSuspended: selectedUser.isSuspended,
            })
          }
          className={`flex-1 !h-11 !rounded-lg !text-white !font-bold !text-sm !shadow-none !border-none ${
            selectedUser.isSuspended
              ? "!bg-green-500 hover:!bg-green-600"
              : "!bg-red-500 hover:!bg-red-600"
          }`}>
          {selectedUser.isSuspended ? "AKTIFKAN" : "SUSPEND"}
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">List User</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola semua akun dan hak akses sistem Arenaku
            </p>
          </div>

          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 160 }}
            className="!h-10 [&_.ant-select-selector]:!rounded-full"
            options={[
              { value: "ALL", label: "Semua Role" },
              { value: "ADMIN", label: "Admin" },
              { value: "VENDOR", label: "Vendor" },
              { value: "CUSTOMER", label: "Customer" },
            ]}
          />
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <DataTable
            columns={columns}
            dataSource={filteredUsers}
            isLoading={loading}
            totalData={filteredUsers.length}
            showSearch
            searchPlaceholder="Cari nama atau email..."
          />
        </div>
      </div>

      <CustomDrawer
        title={
          <span className="text-xl font-bold text-slate-800">Detail User</span>
        }
        open={drawerOpen}
        setOpen={setDrawerOpen}
        content={renderDrawerContent()}
        extra={selectedUser && statusBadge(selectedUser.isSuspended)}
        footer={renderDrawerFooter()}
      />

      <DeleteModal
        open={deleteModal.open}
        dataName={deleteModal.userName}
        onCancel={() =>
          setDeleteModal({ open: false, userId: null, userName: "" })
        }
        onDelete={() => {
          if (deleteModal.userId) handleDelete(deleteModal.userId);
          setDeleteModal({ open: false, userId: null, userName: "" });
        }}
      />

      <AlertDialog
        open={actionModal.open}
        danger={!actionModal.isSuspended}
        title={actionModal.isSuspended ? "Aktifkan User?" : "Suspend User?"}
        description={
          actionModal.isSuspended
            ? "User akan mendapatkan kembali akses penuh ke sistem."
            : "User yang disuspend tidak akan bisa login atau melakukan transaksi."
        }
        confirmText={actionModal.isSuspended ? "Ya, Aktifkan" : "Ya, Suspend"}
        onCancel={() =>
          setActionModal({ open: false, userId: null, isSuspended: false })
        }
        onConfirm={() => {
          if (actionModal.userId)
            handleSuspendToggle(actionModal.userId, actionModal.isSuspended);
          setActionModal({ open: false, userId: null, isSuspended: false });
        }}
      />
    </>
  );
}
