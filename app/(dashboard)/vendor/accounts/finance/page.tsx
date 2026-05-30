"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { message, Modal, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  HiOutlineBanknotes,
  HiOutlineBuildingLibrary,
  HiOutlineArrowDownTray,
  HiBanknotes,
  HiOutlinePencilSquare,
} from "react-icons/hi2";
import api from "@/lib/axios";
import DataTable from "@/components/reusable/DataTable";

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  adminNote?: string;
}

export default function FinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [vendorRole, setVendorRole] = useState<string>("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get("/vendor/profile");
      setVendor(profileRes.data.vendor);
      setVendorRole(profileRes.data.vendorRole);

      const withdrawRes = await api.get("/vendor/withdraw");
      setWithdrawals(withdrawRes.data.withdrawals || []);
    } catch (error) {
      message.error("Gagal memuat data keuangan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount < 10000) {
      message.warning("Minimal penarikan adalah Rp 10.000");
      return;
    }

    if (withdrawAmount > (vendor?.balance || 0)) {
      message.error("Saldo tidak mencukupi");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/vendor/withdraw", { amount: withdrawAmount });
      message.success("Request penarikan berhasil diajukan!");
      setIsModalOpen(false);
      setWithdrawAmount(null);
      fetchData();
    } catch (error: any) {
      message.error(
        error.response?.data?.error || "Gagal mengajukan penarikan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- BADGE STATUS ---
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

  const columns: ColumnsType<Withdrawal> = [
    {
      title: "Rekening Tujuan",
      key: "bank",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-slate-700">
            {record.bankName} - {record.accountNumber}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
            a.n {record.accountName || vendor?.bankAccountName || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "Tanggal",
      key: "createdAt",
      sorter: (a, b) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
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
      title: "Nominal",
      dataIndex: "amount",
      key: "amount",
      align: "left",
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => (
        <span className="font-bold text-sm text-slate-600">
          Rp {amount.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      align: "left",
      render: (_, r) => statusBadge(r.status),
    },
    {
      title: "Catatan Admin",
      dataIndex: "adminNote",
      key: "adminNote",
      align: "left",
      render: (note, record) => {
        if (record.status === "PENDING") {
          return (
            <span className="text-xs font-medium text-slate-400 italic">
              Menunggu proses...
            </span>
          );
        }
        return (
          <span className="text-xs font-medium text-slate-500">
            {note || "-"}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return <div className="animate-pulse bg-slate-200 h-64 rounded-2xl"></div>;
  }

  const isBankComplete = vendor?.bankName && vendor?.bankAccountNumber;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Saldo & Penarikan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola pendapatan dan riwayat penarikan dana venue Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KOTAK SALDO */}
        <div className="bg-primary rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-2 mb-4">
              <HiBanknotes size={24} className="text-white" />
              <h2 className="text-purple-100 font-medium">Saldo Tersedia</h2>
            </div>
            <div>
              <h3 className="text-4xl font-extrabold mb-6 truncate">
                Rp {(vendor?.balance || 0).toLocaleString("id-ID")}
              </h3>
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={
                  vendorRole !== "OWNER" ||
                  !isBankComplete ||
                  vendor?.balance < 10000
                }
                className="w-full sm:w-auto px-6 py-3 bg-white text-black cursor-pointer rounded-xl font-bold text-sm hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <HiOutlineArrowDownTray size={18} />
                Tarik Saldo
              </button>
              {vendorRole !== "OWNER" && (
                <p className="text-xs text-purple-200 mt-2">
                  * Hanya Owner yang dapat menarik saldo
                </p>
              )}
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        {/* KOTAK REKENING (SUDAH RESPONSIF) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between group">
          <div>
            {/* Header Kotak: Flexbox menggantikan Absolute */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <HiOutlineBuildingLibrary size={20} />
                </div>
                <h2 className="text-slate-700 font-bold text-lg leading-tight">
                  Rekening Pencairan
                </h2>
              </div>

              {vendorRole === "OWNER" && (
                <button
                  onClick={() => router.push("/vendor/accounts/profile?tab=2")}
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 sm:py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 w-full sm:w-auto">
                  <HiOutlinePencilSquare size={16} />
                  {isBankComplete ? "Ganti Rekening" : "Atur Rekening"}
                </button>
              )}
            </div>

            {/* Isi Detail Rekening */}
            {isBankComplete ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                    Nama Bank
                  </p>
                  <p className="font-extrabold text-slate-800 text-lg">
                    {vendor?.bankName}
                  </p>
                </div>
                {/* Di mobile 1 kolom, di tablet/PC 2 kolom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                      No. Rekening
                    </p>
                    <p className="font-semibold text-slate-700 text-base">
                      {vendor?.bankAccountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                      Atas Nama
                    </p>
                    <p className="font-semibold text-slate-700 text-base">
                      {vendor?.bankAccountName}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-2">
                <p className="text-sm text-orange-700 font-medium leading-relaxed">
                  Anda belum melengkapi data rekening bank. Silakan lengkapi di
                  menu <b>Profil</b> agar dapat menarik saldo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABEL RIWAYAT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">
          Riwayat Penarikan
        </h2>
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

      <Modal
        title={<span className="text-xl font-bold">Tarik Saldo</span>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setWithdrawAmount(null);
        }}
        onOk={handleWithdraw}
        confirmLoading={submitting}
        okText="Ajukan Penarikan"
        cancelText="Batal"
        okButtonProps={{ className: "bg-purple-600 hover:bg-purple-700" }}>
        <div className="py-4 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
            <span className="text-slate-500 font-semibold">
              Saldo Tersedia:
            </span>
            <span className="text-lg font-bold text-slate-800">
              Rp {(vendor?.balance || 0).toLocaleString("id-ID")}
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nominal Penarikan <span className="text-red-500">*</span>
            </label>
            <InputNumber
              style={{ width: "100%" }}
              className="h-12 pt-1 text-lg custom-withdraw-input"
              controls={false}
              onKeyDown={(e) => {
                const allowedKeys = [
                  "Backspace",
                  "Delete",
                  "ArrowLeft",
                  "ArrowRight",
                  "Tab",
                  "0",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                ];
                if (!allowedKeys.includes(e.key)) {
                  e.preventDefault();
                }
              }}
              formatter={(value) => {
                if (!value) return "";
                return `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
              }}
              parser={(value) => {
                const parsed = value!.replace(/\D/g, "");
                return parsed
                  ? (parseInt(parsed) as unknown as number)
                  : ("" as unknown as number);
              }}
              placeholder="Minimal Rp 10.000"
              value={withdrawAmount}
              onChange={(val) => setWithdrawAmount(val)}
              min={0}
              max={vendor?.balance || 0}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
            <p className="text-sm text-blue-700 font-medium leading-relaxed">
              Dana akan ditransfer ke rekening{" "}
              <b>
                {vendor?.bankName} ({vendor?.bankAccountNumber})
              </b>{" "}
              a.n <b>{vendor?.bankAccountName}</b>. Proses pencairan memakan
              waktu 1-2 hari kerja.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
