"use client";

import { useEffect, useState } from "react";
import { Button, message, Select, Input } from "antd";
import { HiEye } from "react-icons/hi2";
import api from "@/lib/axios";
import dayjs from "dayjs";
import DataTable from "@/components/reusable/DataTable";
import CustomDrawer from "@/components/reusable/CustomDrawer";
import type { ColumnsType } from "antd/es/table";

export default function AdminWithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("ALL");

  // Drawer & Action State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // State form keputusan
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/withdrawals");

      let data = res.data.withdrawals;
      if (filter !== "ALL") {
        data = data.filter((w: any) => w.status === filter);
      }

      const sortedData = data.sort(
        (a: any, b: any) =>
          dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      );

      setWithdrawals(sortedData);
    } catch (error) {
      message.error("Gagal memuat data penarikan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const handleProcess = async () => {
    if (!selectedItem || !decision) return;

    if (decision === "REJECT" && !rejectNote.trim()) {
      message.error("Alasan penolakan wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const newStatus = decision === "APPROVE" ? "SUCCESS" : "REJECTED";

      await api.patch(`/admin/withdrawals/${selectedItem.id}`, {
        status: newStatus,
        adminNote:
          decision === "REJECT" ? rejectNote : "Transfer berhasil dikonfirmasi",
      });

      message.success(
        `Penarikan berhasil di${decision === "APPROVE" ? "setujui" : "tolak"}`,
      );
      setDrawerOpen(false);
      setDecision(null);
      setRejectNote("");
      fetchWithdrawals();
    } catch (error: any) {
      message.error(error.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      PENDING: { text: "Menunggu", className: "text-orange-600 bg-orange-50" },
      SUCCESS: { text: "Berhasil", className: "text-green-500 bg-green-50" },
      REJECTED: { text: "Ditolak", className: "text-red-500 bg-red-50" },
    };

    const item = map[status?.toUpperCase()] || {
      text: status,
      className: "text-gray-600 bg-gray-50",
    };

    return (
      <div
        className={`inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
        <span>{item.text}</span>
      </div>
    );
  };

  const columns: ColumnsType<any> = [
    {
      title: "Rekening Tujuan",
      key: "bank",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-slate-700">
            {record.bankName} - {record.accountNumber}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
            a.n {record.accountName}
          </span>
        </div>
      ),
    },
    {
      title: "Vendor",
      key: "vendor",
      render: (_, r) => (
        <span className="font-semibold text-sm text-slate-500">
          {r.vendor?.name}
        </span>
      ),
    },
    {
      title: "Nominal",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <span className="font-semibold text-sm text-slate-600">
          Rp {amount.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Waktu Pengajuan",
      key: "createdAt",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-500">
            {dayjs(r.createdAt).format("DD/MM/YY")}
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-0.5">
            {dayjs(r.createdAt).format("HH:mm")} WIB
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => statusBadge(r.status),
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "left",
      render: (_, record) => (
        <Button
          onClick={() => {
            setSelectedItem(record);
            setDecision(null);
            setRejectNote("");
            setDrawerOpen(true);
          }}
          icon={<HiEye size={18} />}
          className="!h-9 !rounded-full !border-[#F1F5F9] !px-4 !text-blue-500 !font-semibold !shadow-none hover:!bg-blue-50">
          Detail
        </Button>
      ),
    },
  ];

  const renderDrawerContent = () => {
    if (!selectedItem) return null;

    return (
      <div className="space-y-4 mt-2 pb-6">
        {/* INFO VENDOR */}
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            Nama Vendor
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedItem.vendor?.name}
            </p>
          </div>
        </div>

        {/* INFO REKENING */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Tujuan Transfer
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Nama Bank
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-slate-600 text-sm uppercase">
                  {selectedItem.bankName}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Nomor Rekening
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {selectedItem.accountNumber}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Atas Nama
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600 uppercase">
                  {selectedItem.accountName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NOMINAL */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-bold text-blue-800">
              Total Dicairkan
            </span>
            <span className="text-lg font-black text-blue-600">
              Rp {selectedItem.amount?.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* CATATAN ADMIN (Jika sudah diproses) */}
        {selectedItem.status !== "PENDING" && selectedItem.adminNote && (
          <div className="pt-4 border-t border-gray-100 mt-6">
            <p className="text-sm font-bold text-slate-700 mb-3">
              Catatan Proses
            </p>
            <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
              <p className="font-medium text-sm text-slate-600">
                {selectedItem.adminNote}
              </p>
            </div>
          </div>
        )}

        {/* FORM KEPUTUSAN (hanya untuk PENDING) */}
        {selectedItem.status === "PENDING" && (
          <div className="pt-4 border-t border-gray-100 mt-6 animate-in fade-in">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <p className="text-sm font-bold text-slate-700">Tindak Lanjut</p>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">
                  Keputusan <span className="text-red-500">*</span>
                </p>
                <Select
                  className="w-full !h-10"
                  placeholder="Pilih keputusan..."
                  value={decision}
                  onChange={(val) => {
                    setDecision(val);
                    setRejectNote("");
                  }}
                  options={[
                    {
                      value: "APPROVE",
                      label: "Setujui - Transfer Selesai",
                    },
                    { value: "REJECT", label: " Tolak - Kembalikan Saldo" },
                  ]}
                />
              </div>

              {decision === "REJECT" && (
                <div className="animate-in fade-in slide-in-from-top-1">
                  <p className="text-xs font-semibold text-red-600 mb-1.5">
                    Alasan Penolakan <span className="text-red-500">*</span>
                  </p>
                  <Input.TextArea
                    rows={3}
                    className="!rounded-lg"
                    placeholder="Jelaskan alasan penolakan penarikan ini..."
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getFooterButtonProps = () => {
    if (decision === "APPROVE") {
      return {
        label: "SELESAIKAN WITHDRAW",
        className: "!bg-green-500 hover:!bg-green-600 !text-white !border-none",
        disabled: false,
      };
    }
    if (decision === "REJECT") {
      return {
        label: "KONFIRMASI TOLAK",
        className: "!bg-red-500 hover:!bg-red-600 !text-white !border-none",
        disabled: !rejectNote.trim(),
      };
    }
    return null;
  };

  const renderDrawerFooter = () => {
    if (selectedItem?.status !== "PENDING") return null;

    const btnProps = getFooterButtonProps();

    if (!btnProps) {
      // Belum pilih keputusan — footer kosong / tidak ada tombol
      return null;
    }

    return (
      <div className="w-full">
        <Button
          onClick={handleProcess}
          loading={submitting}
          disabled={btnProps.disabled}
          className={`w-full !h-11 !rounded-lg !font-bold !text-sm !shadow-none disabled:!opacity-50 cursor-pointer ${btnProps.className}`}>
          {btnProps.label}
        </Button>
      </div>
    );
  };

  return (
    <>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Kelola Penarikan Dana
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Verifikasi dan proses permintaan pencairan saldo dari vendor
            </p>
          </div>

          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 180 }}
            className="!h-10 [&_.ant-select-selector]:!rounded-full"
            options={[
              { value: "ALL", label: "Semua Status" },
              { value: "PENDING", label: "Pending" },
              { value: "SUCCESS", label: "Berhasil" },
              { value: "REJECTED", label: "Ditolak" },
            ]}
          />
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <DataTable
            columns={columns}
            dataSource={withdrawals}
            isLoading={loading}
            totalData={withdrawals.length}
            totalPage={1}
            page={1}
            limit={10}
          />
        </div>
      </div>

      <CustomDrawer
        title={
          <span className="text-xl font-bold text-slate-800">
            Detail Penarikan
          </span>
        }
        open={drawerOpen}
        setOpen={setDrawerOpen}
        content={renderDrawerContent()}
        extra={selectedItem && statusBadge(selectedItem.status)}
        footer={renderDrawerFooter()}
      />
    </>
  );
}
