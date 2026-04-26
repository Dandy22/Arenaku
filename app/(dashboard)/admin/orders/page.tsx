"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Badge, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { id: string }[];
  payment?: { status: string; method: string };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/orders")
      .then((res) => setOrders(res.data))
      .catch(() => message.error("Gagal memuat data order"))
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<Order> = [
    {
      title: "ID Order",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <span className="font-mono text-xs text-gray-500">
          {id.slice(0, 8)}...
        </span>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, r) => (
        <div>
          <p className="font-medium text-gray-800">{r.customerName}</p>
          <p className="text-xs text-gray-500">{r.customerEmail}</p>
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => (
        <span className="font-semibold text-gray-800">
          Rp {amount?.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items) => <span>{items?.length || 0} lapangan</span>,
    },
    {
      title: "Status Order",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const map: Record<string, string> = {
          PENDING: "orange",
          PAID: "green",
          CANCELLED: "red",
        };
        return <Tag color={map[status]}>{status}</Tag>;
      },
    },
    {
      title: "Pembayaran",
      key: "payment",
      render: (_, r) => {
        if (!r.payment)
          return <span className="text-gray-400 text-xs">Belum ada</span>;
        const map: Record<string, string> = {
          PENDING: "orange",
          SUCCESS: "green",
          FAILED: "red",
          EXPIRED: "default",
        };
        return (
          <div>
            <Tag color={map[r.payment.status]}>{r.payment.status}</Tag>
            <p className="text-xs text-gray-500 mt-0.5">{r.payment.method}</p>
          </div>
        );
      },
    },
    {
      title: "Tanggal",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span className="text-sm text-gray-600">
          {new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">List Order</h1>
        <p className="text-gray-500 text-sm mt-1">
          Monitor semua transaksi pemesanan
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} order`,
          }}
        />
      </div>
    </div>
  );
}
