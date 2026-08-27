import type { NextConfig } from "next";

// docs/08 "Headers" — a real, sensible baseline rather than none.
// Content-Security-Policy is deliberately NOT set here: it needs a fresh
// per-request nonce on script-src (docs-audit M3), which a static
// next.config.ts header can't provide — see src/proxy.ts, which sets it on
// every response instead. Everything below is genuinely static (same value
// on every response), so it stays here.
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions default to a 1 MB body limit; several actions accept
      // base64-encoded images (logos, photos) that exceed that default.
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
