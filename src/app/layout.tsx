import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Geist_Mono, Fraunces } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

// UI face — warm humanist grotesk (see docs/04-design-system.md "Typography").
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brand display serif — wordmark and display headings only (see
// docs/04-design-system.md "Typography").
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2F5D46",
};

const description =
  "Design a beautiful invitation page for any event, share one link with your guests, and track every RSVP in one place.";

// Titles are the bare "ahvaan" (no tagline suffix) so they literally match
// the OAuth consent screen's App name field — Google's branding
// verification compares the two and flags anything beyond an exact match.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ahvaan",
    template: "%s · ahvaan",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "ahvaan",
    title: "ahvaan",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "ahvaan",
    description,
  },
  appleWebApp: {
    capable: true,
    title: "ahvaan",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
