"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Badge, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";

interface Booking {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  price: number;
  field: { name: string; venue: { name: string } };
  order: {
    id: string;
    status: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    payment?: { status: string; method: string };
  };
}

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/vendor/bookings")
      .then((res) => setBookings(res.data))
      .catch(() => message.error("Gagal memuat data booking"))
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<Booking> = [
    {
      title: "Lapangan",
      key: "field",
      render: (_, r) => (
        <div>
          <p className="font-medium text-gray-800">{r.field?.name}</p>
          <p className="text-xs text-gray-500">{r.field?.venue?.name}</p>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, r) => (
        <div>
          <p className="font-medium text-gray-800">{r.order?.customerName}</p>
          <p className="text-xs text-gray-500">{r.order?.customerPhone}</p>
        </div>
      ),
    },
    {
      title: "Tanggal & Jam",
      key: "schedule",
      render: (_, r) => (
        <div>
          <p className="text-sm font-medium">
            {new Date(r.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-xs text-gray-500">
            {r.startHour}:00 - {r.endHour}:00
          </p>
        </div>
      ),
    },
    {
      title: "Harga",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <span className="font-semibold text-purple-700">
          Rp {price?.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Status Order",
      key: "orderStatus",
      render: (_, r) => {
        const map: Record<string, string> = {
          PENDING: "orange",
          PAID: "green",
          CANCELLED: "red",
        };
        return <Tag color={map[r.order?.status]}>{r.order?.status}</Tag>;
      },
    },
    {
      title: "Pembayaran",
      key: "payment",
      render: (_, r) => {
        if (!r.order?.payment)
          return <span className="text-gray-400 text-xs">Belum ada</span>;
        const map: Record<string, string> = {
          PENDING: "orange",
          SUCCESS: "green",
          FAILED: "red",
          EXPIRED: "default",
        };
        return (
          <div>
            <Tag color={map[r.order.payment.status]}>
              {r.order.payment.status}
            </Tag>
            <p className="text-xs text-gray-500 mt-0.5">
              {r.order.payment.method}
            </p>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Booking Masuk</h1>
        <p className="text-gray-500 text-sm mt-1">
          Monitor semua pemesanan lapangan kamu
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} booking`,
          }}
        />
      </div>
    </div>
  );
}
