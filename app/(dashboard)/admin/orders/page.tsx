"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, message, Select, Input } from "antd";
import { HiEye } from "react-icons/hi2";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";

import DataTable from "@/components/reusable/DataTable";
import CustomDrawer from "@/components/reusable/CustomDrawer";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  cancelReason?: string;
  adminNote?: string;
  items: { id: string }[];
  payment?: { status: string; method: string };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  // DRAWER STATE
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // STATE UNTUK PROSES REFUND
  const [refundStatus, setRefundStatus] = useState<"ACCEPT" | "REJECT" | null>(
    null,
  );
  const [adminNote, setAdminNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url =
        filter === "ALL" ? "/admin/orders" : `/admin/orders?status=${filter}`;
      const res = await api.get(url);

      const sortedData = res.data.sort(
        (a: Order, b: Order) =>
          dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      );
      setOrders(sortedData);
    } catch {
      message.error("Gagal memuat data order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.id?.toLowerCase().includes(query) ||
        o.customerName?.toLowerCase().includes(query) ||
        o.customerEmail?.toLowerCase().includes(query),
    );
  }, [orders, searchQuery]);

  const statusBadge = (status: string, isPayment = false) => {
    if (!status && isPayment) {
      return (
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          Belum ada
        </span>
      );
    }
    const map: Record<string, { text: string; className: string }> = {
      PENDING: { text: "Pending", className: "text-yellow-600 bg-yellow-50" },
      PAID: { text: "Lunas", className: "text-green-500 bg-green-50" },
      SUCCESS: { text: "Berhasil", className: "text-green-500 bg-green-50" },
      CANCELLED: { text: "Batal", className: "text-red-500 bg-red-50" },
      FAILED: { text: "Gagal", className: "text-red-500 bg-red-50" },
      EXPIRED: { text: "Expired", className: "text-slate-500 bg-slate-100" },
      REFUND_REQUESTED: {
        text: "Refund Req",
        className: "text-blue-600 bg-blue-50",
      },
      REFUNDED: { text: "Refunded", className: "text-slate-600 bg-slate-100" },
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

  const columns: ColumnsType<Order> = [
    {
      title: "ID Order",
      key: "id",
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500 uppercase">
          #{r.id?.slice(-6) || "-"}
        </span>
      ),
    },
    {
      title: "Customer",
      key: "customerName",
      render: (_, r) => (
        <span className="font-semibold text-sm text-slate-500">
          {r.customerName}
        </span>
      ),
    },
    {
      title: "Email",
      key: "customerEmail",
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500">
          {r.customerEmail}
        </span>
      ),
    },
    {
      title: "Jumlah Item",
      key: "items",
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500">
          {r.items?.length || 0} Item
        </span>
      ),
    },
    {
      title: "Waktu Transaksi",
      key: "transactionTime",
      sorter: (a, b) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-500">
            {dayjs(r.createdAt).format("DD/MM/YY")}
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {dayjs(r.createdAt).format("HH:mm")} WIB
          </span>
        </div>
      ),
    },
    {
      title: "Metode",
      key: "paymentMethod",
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500 uppercase">
          {r.payment?.method?.replace(/_/g, " ") || "-"}
        </span>
      ),
    },
    {
      title: "Total Bayar",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      render: (price) => (
        <span className="font-semibold text-sm text-slate-500">
          Rp {price?.toLocaleString("id-ID")}
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
      title: "Aksi",
      key: "aksi",
      align: "left",
      render: (_, record) => (
        <Button
          onClick={() => {
            setSelectedOrder(record);
            setRefundStatus(null);
            setAdminNote("");
            setDrawerOpen(true);
          }}
          icon={<HiEye size={18} />}
          className="!h-9 !rounded-full !border-[#F1F5F9] !px-4 !text-blue-500 !font-semibold !shadow-none hover:!bg-blue-50 cursor-pointer">
          Detail
        </Button>
      ),
    },
  ];

  const renderDrawerContent = () => {
    if (!selectedOrder) return null;

    const orderDate = dayjs(selectedOrder.createdAt).format(
      "DD MMMM YYYY, HH:mm",
    );

    return (
      <div className="space-y-4 mt-2 pb-6">
        {/* Info Customer */}
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            Nama Pemesan
          </p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600">
              {selectedOrder.customerName}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Email</p>
          <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
            <p className="font-semibold text-sm text-slate-600 truncate">
              {selectedOrder.customerEmail}
            </p>
          </div>
        </div>

        {/* Detail Pesanan */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Detail Pesanan
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                ID Order
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-slate-600 text-sm break-all uppercase">
                  #{selectedOrder.id}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Waktu Transaksi
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {orderDate} WIB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan Pembayaran */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Ringkasan Pembayaran
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Jumlah Item
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {selectedOrder.items?.length || 0} Item
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Total Pembayaran
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-slate-600 text-sm">
                  Rp {selectedOrder.totalAmount?.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Pembayaran */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Status Pembayaran
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Metode Pembayaran
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-slate-600 text-sm uppercase">
                  {selectedOrder.payment?.method?.replace(/_/g, " ") || "-"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Status
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200 flex items-center min-h-[46px]">
                {statusBadge(selectedOrder.payment?.status || "", true)}
              </div>
            </div>
          </div>
        </div>

        {/* Alasan Pembatalan (tampil jika status REFUND) */}
        {(selectedOrder.status === "REFUND_REQUESTED" ||
          selectedOrder.status === "REFUNDED" ||
          selectedOrder.status === "PAID") &&
          selectedOrder.cancelReason && (
            <div className="pt-4 border-t border-gray-100 mt-6 animate-in fade-in">
              <p className="text-sm font-bold text-red-600 mb-3">
                Alasan Pengajuan Pembatalan (User)
              </p>
              <div className="!rounded-lg !p-4 bg-red-50 border !border-red-200">
                <p className="font-medium text-sm text-red-700 ">
                  {selectedOrder.cancelReason}
                </p>
              </div>
            </div>
          )}

        {/* Catatan Admin (tampil jika sudah diproses / status REFUNDED) */}
        {selectedOrder.status === "REFUNDED" && selectedOrder.adminNote && (
          <div className="pt-4 border-t border-gray-100 mt-6 animate-in fade-in">
            <p className="text-sm font-bold text-slate-700 mb-3">
              Catatan Admin
            </p>
            <div className="!rounded-lg !p-4 bg-slate-50 border !border-gray-200">
              <p className="font-medium text-sm text-slate-600">
                {selectedOrder.adminNote}
              </p>
            </div>
          </div>
        )}

        {/* Form Proses Refund (hanya tampil jika status REFUND_REQUESTED) */}
        {selectedOrder.status === "REFUND_REQUESTED" && (
          <div className="pt-4 border-t border-gray-100 mt-6 animate-in fade-in">
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-600 mb-4">
                Tindak Lanjut Admin
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">
                    Keputusan Refund <span className="text-red-500">*</span>
                  </p>
                  <Select
                    className="w-full !h-10"
                    placeholder="Pilih Terima atau Tolak"
                    value={refundStatus}
                    onChange={(val) => setRefundStatus(val)}
                    options={[
                      {
                        value: "ACCEPT",
                        label: "Terima — Dana Dikembalikan",
                      },
                      { value: "REJECT", label: "Tolak — Tetap Lunas" },
                    ]}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">
                    Catatan Admin <span className="text-red-500">*</span>
                  </p>
                  <Input.TextArea
                    rows={3}
                    className="!rounded-lg"
                    placeholder="Jelaskan alasan diterima/ditolaknya refund ini..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleProcessRefund = async () => {
    if (!refundStatus || !adminNote.trim()) {
      message.error("Keputusan dan Catatan Admin wajib diisi!");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put(`/admin/orders/${selectedOrder!.id}`, {
        action: "process-refund",
        refundStatus,
        adminNote,
      });
      message.success(
        `Refund berhasil di${refundStatus === "ACCEPT" ? "terima" : "tolak"}`,
      );
      setDrawerOpen(false);
      fetchOrders();
    } catch (error: any) {
      message.error(error.response?.data?.error || "Gagal memproses refund");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDrawerFooter = () => (
    <div className="flex items-center gap-3 w-full">
      <Button
        onClick={() => setDrawerOpen(false)}
        className="flex-1 !h-11 !rounded-lg !border-gray-300 hover:!bg-gray-50 !text-slate-600 !font-semibold !text-sm cursor-pointer">
        Kembali
      </Button>
      {selectedOrder?.status === "REFUND_REQUESTED" && (
        <Button
          onClick={handleProcessRefund}
          loading={isSubmitting}
          disabled={!refundStatus || !adminNote.trim()}
          className="flex-1 !h-11 !rounded-lg !text-white !font-bold !text-sm !shadow-none !border-none !bg-primary hover:!bg-purple-700 disabled:!opacity-50 cursor-pointer">
          SIMPAN KEPUTUSAN
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Daftar Order</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor semua transaksi pemesanan
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
              { value: "PAID", label: "Paid" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "REFUND_REQUESTED", label: "Refund Requested" },
              { value: "REFUNDED", label: "Refunded" },
            ]}
          />
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <DataTable
            columns={columns}
            dataSource={filteredOrders}
            isLoading={loading}
            totalData={filteredOrders.length}
            totalPage={1}
            page={1}
            limit={10}
            showSearch
            searchPlaceholder="Cari nama customer, email, atau ID order..."
          />
        </div>
      </div>

      <CustomDrawer
        title={
          <span className="text-xl font-bold text-slate-800">Detail Order</span>
        }
        open={drawerOpen}
        setOpen={setDrawerOpen}
        content={renderDrawerContent()}
        extra={selectedOrder && statusBadge(selectedOrder.status)}
        footer={renderDrawerFooter()}
      />
    </>
  );
}
