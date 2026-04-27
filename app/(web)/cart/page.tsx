"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { message, Modal, Form, Input } from "antd";
import { HiOutlineTrash } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      setCart(res.data);
    } catch {
      message.error("Gagal memuat cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/cart/${id}`);
      message.success("Item dihapus");
      fetchCart();
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
    const hours = item.endHour - item.startHour;
    return acc + item.field?.price * hours;
  }, 0);

  if (loading)
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-gray-100 rounded-2xl h-40 animate-pulse" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Periksa Pesanan Anda
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Pastikan detail pemesanan sudah sesuai dan benar.
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Cart kosong</p>
          <button
            onClick={() => router.push("/venues")}
            className="mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}>
            Cari Venue
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 mb-6">
            {cart.map((item) => {
              const hours = item.endHour - item.startHour;
              const subtotal = item.field?.price * hours;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Detail Pesanan</h3>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm">
                      <HiOutlineTrash size={16} /> Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Nama Venue</p>
                      <p className="font-semibold text-gray-800">
                        {item.field?.venue?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Tanggal</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(item.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Nama Lapangan</p>
                      <p className="font-semibold text-gray-800">
                        {item.field?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Subtotal</p>
                      <p className="font-semibold text-gray-800">
                        Rp. {subtotal?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Jam</p>
                      <p className="font-semibold text-gray-800">
                        {String(item.startHour).padStart(2, "0")}:00 -{" "}
                        {String(item.endHour).padStart(2, "0")}:00
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total + Button */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="text-xl font-bold text-purple-700">
                Rp. {total.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Sticky bottom */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => {
                form.setFieldsValue({
                  customerName: user?.name || "",
                  customerEmail: user?.email || "",
                });
                setCheckoutModal(true);
              }}
              className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition"
              style={{
                background: "linear-gradient(135deg, #EF4444, #DC2626)",
              }}>
              KONFIRMASI PEMESANAN
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
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
