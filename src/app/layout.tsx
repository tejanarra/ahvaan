import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://swathi.tejanarra.space";

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
