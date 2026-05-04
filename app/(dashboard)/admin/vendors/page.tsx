"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, message, Select } from "antd";
import { HiEye, HiOutlineTrash } from "react-icons/hi2";
import { useSearchParams } from "next/navigation";

import DataTable from "@/components/reusable/DataTable";
import DeleteModal from "@/components/reusable/DeleteModal";
import AlertDialog from "@/components/reusable/AlertDialog";
import CustomDrawer from "@/components/reusable/CustomDrawer";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";

// INTERFACE VENDOR
interface Vendor {
  id: string;
  name: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  members: {
    user: {
      name: string;
      email: string;
      phone: string;
      address?: string;
      district?: string;
    };
  }[];
  venues: {
    id: string;
    name: string;
    fields?: { id: string }[];
  }[];
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  // --- MENGAMBIL KEYWORD SEARCH DARI URL ---
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    vendorId: string | null;
  }>({
    open: false,
    vendorId: null,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    vendorId: string | null;
  }>({
    open: false,
    vendorId: null,
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
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

  // --- LOGIKA FILTER PENCARIAN (BERFUNGSI) ---
  const filteredVendors = useMemo(() => {
    if (!searchQuery) return vendors;

    const query = searchQuery.toLowerCase();
    return vendors.filter((v) => {
      const user = v.members?.[0]?.user;
      return (
        v.name?.toLowerCase().includes(query) ||
        user?.name?.toLowerCase().includes(query) ||
        user?.email?.toLowerCase().includes(query) ||
        user?.district?.toLowerCase().includes(query) ||
        v.bankName?.toLowerCase().includes(query)
      );
    });
  }, [vendors, searchQuery]);

  const handleStatus = async (id: string, status: "VERIFIED" | "REJECTED") => {
    try {
      await api.patch(`/admin/vendors/${id}`, { status });
      message.success(
        `Vendor berhasil ${status === "VERIFIED" ? "diverifikasi" : "direject"}`,
      );
      setDrawerOpen(false);
      setRejectModal({ open: false, vendorId: null });
      fetchVendors();
    } catch {
      message.error("Gagal update status vendor");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/vendors/${id}`);
      message.success("Vendor berhasil dihapus");
      fetchVendors();
    } catch {
      message.error("Gagal menghapus vendor");
    }
  };

  const statusBadge = (status: "PENDING" | "VERIFIED" | "REJECTED") => {
    const map = {
      PENDING: { text: "Pending", className: "text-yellow-500 bg-yellow-50" },
      VERIFIED: { text: "Verified", className: "text-green-500 bg-green-50" },
      REJECTED: { text: "Rejected", className: "text-red-500 bg-red-50" },
    };
    const item = map[status];
    return (
      <div
        className={`inline-flex items-center h-8 gap-2 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
        <span>{item.text}</span>
      </div>
    );
  };

  const columns: ColumnsType<Vendor> = [
    {
      title: "Nama Vendor",
      key: "name",
      render: (_, record) => (
        <span className="font-semibold text-slate-500">
          {record.name || record.members?.[0]?.user?.name || "-"}
        </span>
      ),
    },
    {
      title: "Email",
      key: "email",
      render: (_, record) => (
        <span className="text-sm font-semibold text-slate-500">
          {record.members?.[0]?.user?.email || "-"}
        </span>
      ),
    },
    {
      title: "Kecamatan",
      key: "district",
      render: (_, record) => (
        <span className="font-semibold text-slate-500 uppercase text-sm">
          {record.members?.[0]?.user?.district || "-"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => statusBadge(record.status),
    },
    {
      title: "Rekening",
      key: "bank",
      render: (_, record) => (
        <span className="text-sm font-medium text-slate-500 uppercase">
          {record.bankName
            ? `${record.bankName} - ${record.bankAccountNumber}`
            : "Belum diisi"}
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "left",
      render: (_, record) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              setSelectedVendor(record);
              setDrawerOpen(true);
            }}
            icon={<HiEye className="text-[18px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !px-4 !text-blue-500 !font-semibold !shadow-none hover:!bg-blue-50 [&_.ant-btn-icon]:!flex [&_.ant-btn-icon]:!items-center">
            Detail
          </Button>
          <Button
            onClick={() => setDeleteModal({ open: true, vendorId: record.id })}
            icon={<HiOutlineTrash className="text-[18px]" />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !bg-white !shadow-none !text-red-500 hover:!bg-red-50 font-semibold">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const renderDrawerContent = () => {
    if (!selectedVendor) return null;

    const vendorUser = selectedVendor.members?.[0]?.user;
    const totalFields = selectedVendor.venues?.reduce(
      (total, venue) => total + (venue.fields?.length || 0),
      0,
    );

    return (
      <div className="space-y-4 mt-2 pb-8">
        {/* --- PROFIL VENDOR --- */}
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            Nama Vendor
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedVendor.name || vendorUser?.name || "-"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            Nama Pemilik Vendor
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {vendorUser?.name || "-"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Email</p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {vendorUser?.email || "-"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            No. Handphone
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {vendorUser?.phone || "-"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            Alamat Lengkap
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {vendorUser?.address || "-"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Kecamatan</p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600 uppercase">
              {vendorUser?.district || "-"}
            </p>
          </div>
        </div>

        {/* --- INFORMASI REKENING --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-4">
            Informasi Rekening Bank
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Nama Bank</p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600 uppercase">
              {selectedVendor.bankName || "-"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            No. Rekening
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedVendor.bankAccountNumber || "-"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            Nama Pemilik Rekening
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600 uppercase">
              {selectedVendor.bankAccountName || "-"}
            </p>
          </div>
        </div>

        {/* --- INFORMASI PROPERTI (WARNA UNGU & BIRU) --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Informasi Properti
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-purple-50 p-4 border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-1">
                Total Venue
              </p>
              <p className="text-2xl font-bold text-purple-700">
                {selectedVendor.venues?.length || 0}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">
                Total Lapangan
              </p>
              <p className="text-2xl font-bold text-blue-700">{totalFields}</p>
            </div>
          </div>
        </div>

        {selectedVendor.venues?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-500 mb-2">
              Daftar Venue
            </p>
            <div className="space-y-2">
              {selectedVendor.venues.map((venue) => (
                <div
                  key={venue.id}
                  className="flex items-center justify-between !rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                  <span className="font-semibold text-sm text-slate-600">
                    {venue.name}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    {venue.fields?.length || 0} Lapangan
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // FOOTER DRAWER - 100% DIKEMBALIKAN KE KODE ASLIMU
  const renderDrawerFooter = () => {
    if (!selectedVendor) return null;

    if (selectedVendor.status === "PENDING") {
      return (
        <div className="flex gap-3 pt-2 w-full">
          <button
            onClick={() =>
              setRejectModal({ open: true, vendorId: selectedVendor.id })
            }
            className="flex-1 h-12 rounded-xl text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 font-bold text-sm uppercase tracking-wide">
            Reject
          </button>
          <Button
            onClick={() => handleStatus(selectedVendor.id, "VERIFIED")}
            type="primary"
            className="flex-1 !h-12 !rounded-xl !bg-purple-500 hover:!bg-[#6D28D9] !font-bold text-sm tracking-wide border-none uppercase">
            Verifikasi
          </Button>
        </div>
      );
    }

    if (selectedVendor.status === "VERIFIED") {
      return (
        <div className="flex gap-3 pt-2 w-full">
          <Button
            onClick={() => setDrawerOpen(false)}
            className="flex-1 !h-12 !rounded-xl !border-gray-200 !text-gray-500 hover:!border-gray-300 hover:!text-gray-700 font-semibold text-sm">
            Kembali
          </Button>
          <button
            onClick={() =>
              setRejectModal({ open: true, vendorId: selectedVendor.id })
            }
            className="flex-1 h-12 rounded-xl text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 font-bold text-sm uppercase tracking-wide">
            Reject
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-3 pt-2 w-full">
        <Button
          onClick={() => setDrawerOpen(false)}
          className="flex-1 !h-12 !rounded-xl !border-gray-200 !text-gray-500 hover:!border-gray-300 hover:!text-gray-700 font-semibold text-sm">
          Kembali
        </Button>
        <Button
          onClick={() => handleStatus(selectedVendor.id, "VERIFIED")}
          type="primary"
          className="flex-1 !h-12 !rounded-xl !bg-purple-500 hover:!bg-[#6D28D9] !font-bold text-sm tracking-wide border-none uppercase">
          Verifikasi Ulang
        </Button>
      </div>
    );
  };

  return (
    <>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">List Vendor</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola dan verifikasi data vendor mitra Arenaku
            </p>
          </div>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 160 }}
            className="!h-10 [&_.ant-select-selector]:!rounded-full"
            options={[
              { value: "ALL", label: "Semua Status" },
              { value: "PENDING", label: "Pending" },
              { value: "VERIFIED", label: "Verified" },
              { value: "REJECTED", label: "Rejected" },
            ]}
          />
        </div>

        <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-6">
          <DataTable
            columns={columns}
            dataSource={filteredVendors} // DATA DARI HASIL PENCARIAN
            isLoading={loading}
            totalData={filteredVendors.length}
            showSearch
            searchPlaceholder="Cari nama vendor, email, atau bank..."
          />
        </div>
      </div>

      <CustomDrawer
        title={
          <span className="text-xl font-bold text-slate-800">
            Detail Vendor
          </span>
        }
        open={drawerOpen}
        setOpen={setDrawerOpen}
        content={renderDrawerContent()}
        extra={selectedVendor && statusBadge(selectedVendor.status)}
        footer={renderDrawerFooter()} // 100% KEMBALI KE KODEMU
      />

      <DeleteModal
        open={deleteModal.open}
        dataName={
          vendors.find((v) => v.id === deleteModal.vendorId)?.members?.[0]?.user
            ?.name
        }
        onCancel={() => setDeleteModal({ open: false, vendorId: null })}
        onDelete={() =>
          deleteModal.vendorId && handleDelete(deleteModal.vendorId)
        }
      />

      <AlertDialog
        open={rejectModal.open}
        danger
        title="Tolak Vendor?"
        description="Vendor yang ditolak (rejected) tidak akan dapat menambahkan lapangan dan menerima booking."
        confirmText="Ya, Tolak Vendor"
        onCancel={() => setRejectModal({ open: false, vendorId: null })}
        onConfirm={() =>
          rejectModal.vendorId && handleStatus(rejectModal.vendorId, "REJECTED")
        }
      />
    </>
  );
}
