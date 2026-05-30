"use client";

import { useState, useEffect } from "react";
import { Button, Input, message, Modal, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineUserPlus,
} from "react-icons/hi2";

// Reusable Components (Pastikan path import sesuai folder kamu)
import DataTable from "@/components/reusable/DataTable";
import CustomDrawer from "@/components/reusable/CustomDrawer";
import DeleteModal from "@/components/reusable/DeleteModal";
import api from "@/lib/axios";
import { useAuthStore } from "@/lib/store/auth.store"; // 👉 Import auth store

interface User {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  role: "OWNER" | "STAFF";
  joinedDate?: string;
  avatarUrl?: string;
}

export default function ManageUsersPage() {
  // 👉 Ambil data user yang sedang login dari global state
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    ownerPassword: "",
  });

  // 👉 Menentukan role spesifik user yang login (OWNER/STAFF) berdasarkan data list members
  const currentUserMemberInfo = users.find((u) => u.id === user?.id);
  const currentUserRole = currentUserMemberInfo?.role || "STAFF"; // Default ke STAFF jika belum terload

  const handleInviteSubmit = async () => {
    try {
      setInviteSubmitting(true);

      const response = await fetch("/api/vendor/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          email: inviteForm.email,
          ownerPassword: inviteForm.ownerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengundang pengguna");
      }

      message.success(data.message || "Undangan berhasil dikirim!");
      setInviteModalOpen(false);
      setInviteForm({ email: "", ownerPassword: "" }); // Reset form

      // Refresh daftar members
      fetchMembers();
    } catch (error: any) {
      message.error(
        error.message ||
          "Gagal mengundang pengguna. Pastikan email dan password Anda benar.",
      );
    } finally {
      setInviteSubmitting(false);
    }
  };

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    memberId: string | null; // 🔥 Ganti userId jadi memberId
    userName: string;
  }>({
    open: false,
    memberId: null,
    userName: "",
  });

  // --- STATE BARU UNTUK EDIT ROLE ---
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editRoleValue, setEditRoleValue] = useState<"OWNER" | "STAFF">(
    "STAFF",
  );
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Fetch members from API
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendor/members");
      const membersData = res.data.members || [];

      const formattedUsers: User[] = membersData.map((m: any) => ({
        id: m.user.id,
        memberId: m.id, // 🔥 TAMBAHKAN INI
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone || "-",
        role: m.role,
        joinedDate: m.user.createdAt,
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      message.error("Gagal memuat data anggota");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDeleteUser = async (memberId: string) => {
    try {
      // 1. Tembak API Backend beneran buat hapus data di Database
      await api.delete(`/vendor/members/${memberId}`);

      // 2. Kalau sukses, baru hapus dari tampilan layar
      setUsers(users.filter((u) => u.memberId !== memberId));
      message.success("Pengguna berhasil dihapus!");
    } catch (error: any) {
      message.error(error.response?.data?.error || "Gagal menghapus pengguna");
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    try {
      setLoadingEdit(true);

      // TODO: Uncomment & sesuaikan dengan endpoint backend kamu
      // await api.put(`/vendor/members/${selectedUser.id}/role`, { role: editRoleValue });

      // Update state lokal biar UI langsung berubah tanpa refresh
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, role: editRoleValue } : u,
        ),
      );
      setSelectedUser({ ...selectedUser, role: editRoleValue });

      message.success("Role pengguna berhasil diubah");
      setIsEditingRole(false);
    } catch (error: any) {
      message.error("Gagal mengubah role pengguna");
    } finally {
      setLoadingEdit(false);
    }
  };

  const roleBadge = (role: string) => {
    const map: any = {
      OWNER: { text: "Owner", className: "text-purple-600 bg-purple-50" },
      STAFF: { text: "Staff", className: "text-blue-500 bg-blue-50" },
    };
    const item = map[role] || map.STAFF;
    return (
      <div
        className={`inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-sm font-medium ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        {item.text}
      </div>
    );
  };

  const columns: ColumnsType<User> = [
    {
      title: "Nama Pengguna",
      key: "name",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-500 text-sm">
            {r.name}
            {/* Tanda jika ini adalah diri sendiri */}
            {r.id === user?.id && (
              <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                Anda
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      title: "Email",
      key: "email",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-500 text-sm">
            {r.email}
          </span>
        </div>
      ),
    },
    {
      title: "Jabatan",
      dataIndex: "role",
      key: "role",
      render: (role) => roleBadge(role),
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "left",
      width: 250,
      render: (_, r) => {
        // 👉 Cek apakah baris ini adalah user yang sedang login
        const isSelf = r.id === user?.id;

        return (
          <div className="flex items-center justify-start gap-2">
            <Button
              onClick={() => {
                setSelectedUser(r);
                setIsEditingRole(false); // Reset mode edit tiap buka user baru
                setEditRoleValue(r.role); // Set value awal edit sesuai role user
                setDrawerOpen(true);
              }}
              icon={<HiOutlineEye className="text-[18px]" />}
              className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-blue-500 hover:!bg-blue-50 hover:!border-blue-200 !font-semibold">
              Detail
            </Button>

            {/* Tombol Hapus */}
            {currentUserRole === "OWNER" && !isSelf && r.role !== "OWNER" && (
              <Button
                danger
                onClick={() =>
                  // 🔥 Gunakan memberId, bukan id
                  setDeleteModal({
                    open: true,
                    memberId: r.memberId,
                    userName: r.name,
                  })
                }
                icon={<HiOutlineTrash className="text-[18px]" />}
                className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-red-500 hover:!bg-red-50 hover:!border-red-200 !font-semibold">
                Hapus
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const renderDrawerContent = () => {
    if (!selectedUser) return null;
    return (
      <div className="space-y-5 mt-2">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">User ID</p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedUser.id}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Nama</p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedUser.name}
            </p>
          </div>
        </div>

        {/* BAGIAN ROLE */}
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Role</p>
          {isEditingRole ? (
            <Select
              className="w-full h-11"
              value={editRoleValue}
              onChange={(val) => setEditRoleValue(val)}
              options={[
                { value: "OWNER", label: "Owner" },
                { value: "STAFF", label: "Staff" },
              ]}
            />
          ) : (
            <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
              <p className="font-semibold text-sm text-slate-600">
                {selectedUser.role}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Email</p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedUser.email}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            No Telepon
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedUser.phone}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderDrawerFooter = () => {
    if (!selectedUser) return null;

    // 👉 Cek apakah user yang dibuka adalah diri sendiri
    const isSelf = selectedUser.id === user?.id;
    // 👉 Hanya bisa edit jika dia adalah OWNER DAN bukan mengedit dirinya sendiri
    const canEditRole = currentUserRole === "OWNER" && !isSelf;

    // Jika tidak ada izin edit, hanya tampilkan tombol "Tutup"
    if (!canEditRole) {
      return (
        <div className="flex gap-4 pt-4 pb-4 px-6 -mx-6 border-t border-gray-100">
          <Button
            onClick={() => setDrawerOpen(false)}
            className="flex-1 !h-12 !rounded-xl !border-slate-200 !text-slate-500 !font-semibold">
            Tutup
          </Button>
        </div>
      );
    }

    // Jika punya izin dan sedang dalam mode Edit
    if (isEditingRole) {
      return (
        <div className="flex gap-4 pt-4 pb-4 px-6 -mx-6 border-t border-gray-100">
          <Button
            onClick={() => {
              setIsEditingRole(false);
              setEditRoleValue(selectedUser?.role || "STAFF"); // kembalikan nilai asal
            }}
            className="flex-1 !h-12 !rounded-xl !border-slate-200 !text-slate-500 !font-semibold">
            Batalkan Perubahan
          </Button>
          <Button
            type="primary"
            onClick={handleSaveRole}
            loading={loadingEdit}
            className="flex-1 !h-12 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !border-none !text-white !font-semibold !shadow-none">
            Simpan Perubahan
          </Button>
        </div>
      );
    }

    // Jika punya izin mode normal (hanya lihat detail, ada tombol Edit)
    return (
      <div className="flex gap-4 pt-4 pb-4 px-6 -mx-6 border-t border-gray-100">
        <Button
          onClick={() => setDrawerOpen(false)}
          className="flex-1 !h-12 !rounded-xl !border-slate-200 !text-slate-500 !font-semibold">
          Tutup
        </Button>
        <Button
          type="primary"
          onClick={() => setIsEditingRole(true)}
          className="flex-1 !h-12 !rounded-xl !bg-[#7C3AED] hover:!bg-[#612dbb] !border-none !text-white !font-semibold !shadow-none">
          Edit
        </Button>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Pengguna</h1>
          <p className="text-gray-500 text-sm mt-1">
            Atur anggota tim Anda yang memiliki akses ke dashboard ini
          </p>
        </div>

        {/* 👉 Tombol undang juga disembunyikan untuk STAFF (opsional, tapi disarankan) */}
        {currentUserRole === "OWNER" && (
          <Button
            type="primary"
            onClick={() => setInviteModalOpen(true)}
            icon={<HiOutlinePlus className="text-[18px]" />}
            className="!h-10 !rounded-full !border-none !text-white !font-semibold !shadow-none !bg-[#7C3AED] hover:!bg-[#612dbb]">
            Undang Pengguna
          </Button>
        )}
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <DataTable columns={columns} dataSource={users} isLoading={loading} />
      </div>
      <CustomDrawer
        title="Detail Pengguna"
        open={drawerOpen}
        setOpen={setDrawerOpen}
        content={renderDrawerContent()}
        footer={renderDrawerFooter()}
      />
      <DeleteModal
        open={deleteModal.open}
        dataName={deleteModal.userName}
        onCancel={() => setDeleteModal({ ...deleteModal, open: false })}
        onDelete={() => {
          // 🔥 Panggil fungsi delete dengan memberId
          if (deleteModal.memberId) handleDeleteUser(deleteModal.memberId);
          setDeleteModal({ open: false, memberId: null, userName: "" });
        }}
      />
      {/* Modal Undang Pengguna */}
      <Modal
        title={
          <span className="text-xl font-bold text-slate-800">
            Undang Pengguna
          </span>
        }
        open={inviteModalOpen}
        onCancel={() => setInviteModalOpen(false)}
        footer={null}
        centered
        width={480}
        closeIcon={<span className="text-lg">✕</span>}>
        <div className="pt-2 space-y-5">
          {/* Info Otomatis */}
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg flex items-start gap-3">
            <p className="text-sm text-purple-500 font-medium leading-relaxed">
              Sistem akan otomatis mengenali pengguna berdasarkan email. Role
              awal mereka adalah <span className="font-bold">STAFF</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Email Pengguna <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="contoh@email.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="!rounded-lg !py-2.5 !border-gray-200 !text-sm !font-semibold !text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                Password Anda (Owner) <span className="text-red-500">*</span>
              </label>
              <Input.Password
                placeholder="Masukkan password Anda untuk verifikasi"
                value={inviteForm.ownerPassword}
                onChange={(e) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    ownerPassword: e.target.value,
                  }))
                }
                className="!rounded-lg !py-2.5 !border-gray-200 !text-sm !font-semibold !text-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-dashed border-gray-200">
            <Button
              onClick={() => setInviteModalOpen(false)}
              className="flex-1 !h-12 !rounded-xl !bg-[#F8F9FA] hover:!bg-gray-200 !text-slate-600 !border-none font-bold text-base">
              Batal
            </Button>
            <Button
              type="primary"
              loading={inviteSubmitting}
              onClick={handleInviteSubmit}
              disabled={!inviteForm.email || !inviteForm.ownerPassword}
              className="flex-1 !h-12 !rounded-xl !bg-[#7C3AED] hover:!bg-[#6D28D9] !font-bold text-base !shadow-none !border-none disabled:!bg-gray-300 disabled:!text-gray-500">
              Kirim Undangan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
