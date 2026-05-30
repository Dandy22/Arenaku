"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { message, Modal, Form, Input } from "antd";
import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import { useCartStore } from "@/lib/store/cart.store";
import api from "@/lib/axios";

export default function CartPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const {
    items: cart,
    loading,
    fetchCart,
    removeItem,
    clearCart,
  } = useCartStore();
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!isInitialized) return; // Wait for auth initialization

    if (!user) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, [user, isInitialized]);

  const handleDelete = async (id: string) => {
    try {
      await removeItem(id);
      message.success("Item dihapus");
    } catch {
      message.error("Gagal menghapus item");
    }
  };

  const handleCheckout = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await api.post("/orders", {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        notes: values.notes || "",
      });
      message.success("Order berhasil dibuat!");
      clearCart();
      setCheckoutModal(false);
      router.push(`/payment/${res.data.id}`);
    } catch (err: any) {
      if (err?.response?.data?.error) {
        message.error(err.response.data.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const total = cart.reduce((acc, item) => {
    if (item.fieldId) {
      const hours = item.endHour - item.startHour;
      return acc + (item.field?.price || 0) * hours;
    }
    if (item.eventId) {
      const ticketPrice = item.ticketPrice ?? item.event?.ticketPrice ?? 0;
      return acc + ticketPrice * (item.quantity || 1);
    }
    return acc;
  }, 0);

  if (loading)
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-slate-100 rounded-2xl h-40 animate-pulse" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-[calc(100vh-250px)]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Periksa Pesanan Anda
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pastikan detail pemesanan sudah sesuai dan benar.
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">Cart kosong</p>
          <button
            onClick={() => router.push("/venues")}
            className="mt-4 px-6 py-2.5 rounded-xl text-white bg-purple-500 font-semibold text-sm cursor-pointer hover:bg-purple-700 transition">
            Cari Venue
          </button>
        </div>
      ) : (
        <>
          {/* List Item Cart */}
          <div className="flex flex-col gap-4 mb-8">
            {cart.map((item) => {
              if (item.fieldId) {
                const hours = item.endHour - item.startHour;
                const subtotal = (item.field?.price || 0) * hours;
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">
                        Booking Lapangan
                      </h3>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-600 cursor-pointer flex items-center gap-1 text-sm">
                        <HiOutlineTrash size={16} /> Hapus
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Nama Venue</p>
                        <p className="font-semibold text-slate-800">
                          {item.field?.venue?.name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Tanggal</p>
                        <p className="font-semibold text-slate-800">
                          {new Date(item.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Nama Lapangan</p>
                        <p className="font-semibold text-slate-800">
                          {item.field?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Subtotal</p>
                        <p className="font-semibold text-slate-800">
                          Rp. {subtotal?.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Jam</p>
                        <p className="font-semibold text-slate-800">
                          {String(item.startHour).padStart(2, "0")}:00 -{" "}
                          {String(item.endHour).padStart(2, "0")}:00
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.eventId) {
                const ticketPrice =
                  item.ticketPrice ?? item.event?.ticketPrice ?? 0;
                const subtotal = ticketPrice * (item.quantity || 1);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">Tiket Event</h3>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-600 cursor-pointer flex items-center gap-1 text-sm">
                        <HiOutlineTrash size={16} /> Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Nama Event</p>
                        <p className="font-semibold text-slate-800">
                          {item.event?.title || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Jenis Tiket</p>
                        <p className="font-semibold text-slate-800">
                          {item.ticketTier?.name || "Standar"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Tanggal Event</p>
                        <p className="font-semibold text-slate-800">
                          {new Date(item.event?.date).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Jumlah Tiket</p>
                        <p className="font-semibold text-slate-800">
                          {item.quantity} Tiket
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Subtotal</p>
                        <p className="font-semibold text-slate-800">
                          Rp. {subtotal?.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Waktu</p>
                        <p className="font-semibold text-slate-800">
                          {String(item.startHour).padStart(2, "0")}:00 -{" "}
                          {String(item.endHour).padStart(2, "0")}:00
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Kotak Total & Tombol Checkout (Sudah digabung & tidak fixed) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-10">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <span className="font-semibold text-slate-800">
                Total Pembayaran
              </span>
              <span className="text-2xl font-bold text-primary">
                Rp. {total.toLocaleString("id-ID")}
              </span>
            </div>

            <button
              onClick={() => {
                form.setFieldsValue({
                  customerName: user?.name || "",
                  customerEmail: user?.email || "",
                });
                setCheckoutModal(true);
              }}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition cursor-pointer shadow-sm"
              style={{
                background: "linear-gradient(135deg, #EF4444, #DC2626)",
              }}>
              KONFIRMASI PEMESANAN
            </button>
          </div>
        </>
      )}

      {/* Modal Form */}
      <Modal
        title="Detail Pemesanan"
        open={checkoutModal}
        onOk={handleCheckout}
        onCancel={() => setCheckoutModal(false)}
        okText="Lanjut ke Pembayaran"
        cancelText="Batal"
        confirmLoading={submitting}
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #EF4444, #DC2626)",
            border: "none",
          },
        }}>
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="customerName"
            label="Nama Lengkap"
            rules={[{ required: true }]}>
            <Input placeholder="Nama Lengkap" />
          </Form.Item>
          <Form.Item
            name="customerPhone"
            label="Nomor Telepon"
            normalize={(value) => (value || "").replace(/[^0-9]/g, "")}
            rules={[{ required: true }]}>
            <Input placeholder="08123456789" />
          </Form.Item>
          <Form.Item
            name="customerEmail"
            label="Email"
            rules={[{ required: true, type: "email" }]}>
            <Input placeholder="email@mail.com" />
          </Form.Item>
          <Form.Item name="notes" label="Catatan (opsional)">
            <Input.TextArea rows={2} placeholder="Catatan tambahan..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
