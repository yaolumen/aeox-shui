import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Shui · Decode Your Personal Energy Cycle",
  description:
    "Free AI-assisted personal energy cycle analysis. Discover your temporal energy vector, seasonal resonance, and spatial harmony strategies.",
  keywords: [
    "Personal Energy Cycle",
    "Temporal Energy Vector",
    "Chronobiological Profile",
    "Seasonal Resonance",
    "Spatial Harmony Design",
    "Five Elements Balance",
    "Environmental Ergonomics",
    "Mindful Living",
  ],
  authors: [{ name: "Shui" }],
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
