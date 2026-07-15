import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

// Initialize server-side WebSocket when Next.js starts (best-effort)
(async () => {
  try {
    await import("./lib/socket");
  } catch (e) {
    // ignore environments where WS can't be started
  }
})();

export default nextConfig;
