import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || "587");
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";

function createTransport() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS must be set in environment variables",
    );
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

// ===============================================
// FUNGSI 1: VERIFIKASI EMAIL
// ===============================================
export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(
    token,
  )}`;

  const transporter = createTransport();

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Verifikasi Akun - Arenaku",
    text: `Silakan verifikasi email Anda dengan mengunjungi link berikut:\n${verificationUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #7C3AED; margin: 0; text-transform: uppercase; letter-spacing: 1px;">ARENAKU</h2>
          <p style="font-size: 14px; color: #64748b; margin-top: 4px;">Konfirmasi Pendaftaran Akun</p>
        </div>
        
        <div style="text-align: center; color: #475569; margin-bottom: 30px;">
          <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 12px;">Selamat Datang!</h3>
          <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Terima kasih telah bergabung. Selangkah lagi untuk mulai menjelajahi dan mem-booking venue olahraga favoritmu. Silakan klik tombol di bawah ini untuk mengaktifkan akun Anda.
          </p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #7C3AED; color: #ffffff; padding: 12px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; letter-spacing: 0.5px;">
            VERIFIKASI EMAIL SAYA
          </a>
        </div>

        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #f1f5f9; text-align: left; font-size: 12px; color: #64748b; word-break: break-all;">
          <p style="margin: 0 0 8px 0;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:</p>
          <a href="${verificationUrl}" style="color: #7C3AED; text-decoration: underline;">${verificationUrl}</a>
        </div>

        <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          <p style="margin: 0;">Email ini dikirim secara otomatis, mohon untuk tidak membalas.</p>
          <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} Arenaku. All rights reserved.</p>
        </div>

      </div>
    `,
  });
}

// ===============================================
// FUNGSI 2: KIRIM INVOICE BOOKING LUNAS
// ===============================================
export async function sendBookingInvoice(email: string, orderData: any) {
  const transporter = createTransport();

  const orderIdShort = orderData.id.slice(-6).toUpperCase();
  const formattedDate = new Date(orderData.createdAt).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  // 1. Generate HTML untuk Booking Lapangan
  const itemsHtml = (orderData.items || [])
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
        <strong>${item.field?.venue?.name || "Venue"}</strong><br>
        <span style="font-size: 12px; color: #64748b;">${item.field?.name}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
        ${new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}<br>
        <span style="font-size: 12px; color: #64748b;">${String(item.startHour).padStart(2, "0")}:00 - ${String(item.endHour).padStart(2, "0")}:00 WIB</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; text-align: right;">
        Rp ${item.price.toLocaleString("id-ID")}
      </td>
    </tr>
  `,
    )
    .join("");

  // 2. Generate HTML untuk Beli Tiket Event (Jika ada)
  const ticketHtml = (orderData.eventTickets || [])
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
        <strong>${item.event?.title || "Tiket Event"}</strong><br>
        <span style="font-size: 12px; color: #64748b;">${item.quantity} Tiket Akses</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
        ${new Date(item.event?.date || orderData.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; text-align: right;">
        Rp ${item.totalPrice.toLocaleString("id-ID")}
      </td>
    </tr>
  `,
    )
    .join("");

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: `[LUNAS] Kode Booking #${orderIdShort} - Arenaku`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #7C3AED; margin: 0; text-transform: uppercase; letter-spacing: 1px;">ARENAKU</h2>
          <p style="font-size: 14px; color: #64748b; margin-top: 4px;">Bukti Pembayaran & Kode Booking Resmi</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #f1f5f9;">
          <table style="width: 100%; font-size: 13px; color: #475569;">
            <tr>
              <td style="padding: 4px 0;"><strong>Kode Booking:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #7C3AED; font-weight: bold; font-size: 16px;">#${orderIdShort}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Nama Pemesan:</strong></td>
              <td style="padding: 4px 0; text-align: right;">${orderData.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Tanggal Transaksi:</strong></td>
              <td style="padding: 4px 0; text-align: right;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Status:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #10B981; font-weight: bold;">LUNAS / PAID</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 15px; color: #1e293b; margin-bottom: 12px;">Rincian Pembelian</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 10px; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0;">ITEM</th>
              <th style="padding: 10px; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0;">JADWAL</th>
              <th style="padding: 10px; text-align: right; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            ${ticketHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 2px solid #f1f5f9; margin-bottom: 30px;">
          <span style="font-size: 14px; font-weight: bold; color: #334155;">Total Bayar</span>
          <span style="font-size: 18px; font-weight: 900; color: #7C3AED; text-align: right; display: block; width: 100%;">Rp ${orderData.totalAmount.toLocaleString("id-ID")}</span>
        </div>

        <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          <p style="margin: 0;">Tunjukkan email atau Kode Booking ini kepada staf lapangan saat tiba di lokasi.</p>
          <p style="margin: 4px 0 0 0;">Terima kasih telah mempercayakan aktivitasmu pada Arenaku!</p>
        </div>
      </div>
    `,
  });
}
