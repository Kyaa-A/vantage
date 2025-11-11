import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../providers";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VANTAGE - SGLGB Assessment Platform",
  description: "Governance assessment platform for DILG's Seal of Good Local Governance for Barangays (SGLGB)",
  icons: {
    icon: "/officialLogo/VANTAGE.webp",
    apple: "/officialLogo/VANTAGE.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <SonnerToaster />
        <Toaster />
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}
