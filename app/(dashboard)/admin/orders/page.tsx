"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, message, Select } from "antd";
import { HiEye } from "react-icons/hi2";
import { useSearchParams } from "next/navigation";

import DataTable from "@/components/reusable/DataTable";
import CustomDrawer from "@/components/reusable/CustomDrawer";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string; // PENDING, PAID, CANCELLED
  createdAt: string;
  items: { id: string }[];
  payment?: { status: string; method: string }; // PENDING, SUCCESS, FAILED, EXPIRED
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Asumsi API mendukung query parameter filter status order
      const url =
        filter === "ALL" ? "/admin/orders" : `/admin/orders?status=${filter}`;
      const res = await api.get(url);
      setOrders(res.data);
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

  // --- BADGES ---
  const orderStatusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      PENDING: { text: "Pending", className: "text-amber-600 bg-amber-50" },
      PAID: { text: "Paid", className: "text-green-600 bg-green-50" },
      CANCELLED: { text: "Cancelled", className: "text-red-500 bg-red-50" },
      REFUND_REQUESTED: {
        text: "Refund Requested",
        className: "text-blue-600 bg-blue-50",
      },
      REFUNDED: { text: "Refunded", className: "text-slate-600 bg-slate-100" },
    };
    const item = map[status] || {
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

  const paymentStatusBadge = (status?: string) => {
    if (!status)
      return (
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          Belum ada
        </span>
      );

    const map: Record<string, { text: string; className: string }> = {
      PENDING: { text: "Pending", className: "text-amber-600 bg-amber-50" },
      SUCCESS: { text: "Success", className: "text-green-600 bg-green-50" },
      FAILED: { text: "Failed", className: "text-red-500 bg-red-50" },
      EXPIRED: { text: "Expired", className: "text-slate-500 bg-slate-100" },
    };
    const item = map[status] || {
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

  // --- TABLE COLUMNS ---
  const columns: ColumnsType<Order> = [
    {
      title: "ID Order",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-500">
            {id.slice(-8).toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      title: "Nama Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-500">{name}</span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "customerEmail",
      key: "customerEmail",
      render: (email) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-500">{email}</span>
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => (
        <span className="font-semibold text-slate-500">
          Rp {amount?.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items) => (
        <span className="text-sm font-semibold text-slate-500">
          {items?.length || 0} Lapangan
        </span>
      ),
    },
    {
      title: "Status Order",
      dataIndex: "status",
      key: "status",
      render: (status) => orderStatusBadge(status),
    },
    {
      title: "Metode",
      key: "payment",
      render: (_, record) => (
        <span className="text-sm font-bold text-slate-500 uppercase">
          {record.payment?.method || "-"}
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "right",
      render: (_, record) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              setSelectedOrder(record);
              setDrawerOpen(true);
            }}
            icon={<HiEye size={18} />}
            className="!h-9 !rounded-full !border-[#F1F5F9] !px-4 !text-blue-500 !font-semibold !shadow-none hover:!bg-blue-50">
            Detail
          </Button>
        </div>
      ),
    },
  ];

  // --- DRAWER CONTENT ---
  const renderDrawerContent = () => {
    if (!selectedOrder) return null;

    const orderDate = new Date(selectedOrder.createdAt).toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    return (
      <div className="space-y-4 mt-2 pb-6">
        {/* --- INFORMASI CUSTOMER --- */}
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

        {/* --- DETAIL PESANAN --- */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm font-bold text-slate-700 mb-3">
            Detail Pesanan
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">
                ID Order
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-slate-600 text-sm break-all">
                  {selectedOrder.id.toUpperCase()}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Tanggal Transaksi
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200">
                <p className="font-semibold text-sm text-slate-600">
                  {orderDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- TOTAL & ITEMS --- */}
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
                  {selectedOrder.items?.length || 0} Lapangan
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

        {/* --- INFORMASI PEMBAYARAN --- */}
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
                  {selectedOrder.payment?.method || "-"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">
                Status
              </p>
              <div className="!rounded-lg !p-3 bg-slate-50 border !border-gray-200 flex items-center min-h-[46px]">
                {paymentStatusBadge(selectedOrder.payment?.status)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleRefundComplete = async (orderId: string) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { action: "refund-complete" });
      message.success("Refund berhasil ditandai selesai");
      setDrawerOpen(false);
      fetchOrders();
    } catch (error: any) {
      message.error(
        error.response?.data?.error || "Gagal menandai refund selesai",
      );
    }
  };

  // --- DRAWER FOOTER ---
  const renderDrawerFooter = () => (
    <div className="flex items-center gap-3 w-full">
      <Button
        onClick={() => setDrawerOpen(false)}
        className="flex-1 !h-11 !rounded-lg !border-gray-300 hover:!bg-gray-50 !text-slate-600 !font-semibold !text-sm">
        Kembali
      </Button>
      {selectedOrder?.status === "REFUND_REQUESTED" && (
        <Button
          onClick={() =>
            selectedOrder && handleRefundComplete(selectedOrder.id)
          }
          className="flex-1 !h-11 !rounded-lg !text-white !font-bold !text-sm !shadow-none !border-none !bg-green-500 hover:!bg-green-600">
          SELESAIKAN REFUND
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-500">List Order</h1>
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
            searchPlaceholder="Cari ID Order atau nama customer..."
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
        extra={selectedOrder && orderStatusBadge(selectedOrder.status)}
        footer={renderDrawerFooter()}
      />
    </>
  );
}
