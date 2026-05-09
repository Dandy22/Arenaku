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

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `http://localhost:3000/api/auth/verify-email?token=${encodeURIComponent(
    token,
  )}`;

  const transporter = createTransport();

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Verifikasi Email Anda",
    text: `Silakan verifikasi email Anda dengan mengunjungi link berikut:\n${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Verifikasi Email</h2>
        <p>Terima kasih telah mendaftar. Klik tombol di bawah ini untuk memverifikasi email Anda:</p>
        <a
          href="${verificationUrl}"
          style="display: inline-block; padding: 12px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;"
        >
          Verifikasi Email
        </a>
        <p>Jika tombol tidak bekerja, salin dan tempel URL berikut ke browser Anda:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      </div>
    `,
  });
}
