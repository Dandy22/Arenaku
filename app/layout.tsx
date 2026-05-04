"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ConfigProvider } from "antd";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={plusJakartaSans.className}>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              colorPrimary: "#7C3AED", // Konsisten dengan brand warna ungu
            },
            components: {
              Drawer: {
                // Opsional: Memastikan drawer tidak mengunci body secara agresif
                zIndexPopup: 1000,
              },
            },
          }}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
