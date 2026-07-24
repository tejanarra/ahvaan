import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const siteUrl = "https://swathi.tejanarra.space";

// viewportFit: "cover" is required for env(safe-area-inset-*) to resolve to
// real values instead of 0 — needed so fixed/absolute UI (like the mobile
// pager's Prev/Next bar) can sit clear of notches and the iOS home-indicator
// area instead of potentially being covered by them.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Swathi & Sai Teja's Wedding RSVP",
  description: "RSVP for the wedding of Swathi Puskoori and Sri Sai Teja Narra",
  openGraph: {
    title: "Swathi & Sai Teja's Wedding RSVP",
    description: "RSVP for the wedding of Swathi Puskoori and Sri Sai Teja Narra",
    url: siteUrl,
    siteName: "Swathi & Sai Teja's Wedding",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swathi & Sai Teja's Wedding RSVP",
    description: "RSVP for the wedding of Swathi Puskoori and Sri Sai Teja Narra",
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
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
