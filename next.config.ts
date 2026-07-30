import type { NextConfig } from "next";

// docs/08 "Headers" — a real, sensible baseline rather than none. Kept
// permissive enough not to break Next's own inline bootstrap scripts
// ('unsafe-inline' on script/style) and host-pasted external image URLs
// (img-src https:) since neither is nonce'd/allow-listed yet — tightening
// either is a live-verified follow-up, not attempted blind here. frame-src
// covers both the sandboxed srcdoc iframes (RSVP confirmation, custom-html
// blocks — same-origin, inherit this policy) and the Google Maps embed.
// Dev-only: Next's dev server (Fast Refresh/Turbopack) uses eval() for
// stack-mapping and hot-reload — 'unsafe-eval' is never needed (or
// included) in production, matching React's own "will never use eval() in
// production" guarantee.
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co${isDev ? " ws:" : ""}`,
  "frame-src 'self' https://www.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
