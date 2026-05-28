"use client";

import { ConfigProvider } from "antd";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "var(--font-plus-jakarta), sans-serif",
          colorPrimary: "#7C3AED",
        },
        components: {
          Drawer: {
            zIndexPopup: 1000,
          },
        },
      }}>
      {children}
    </ConfigProvider>
  );
}
