import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "CelenganKita - Manajemen Anggaran Bersama Pasangan",
  description: "Aplikasi pencatatan keuangan bersama untuk pasangan cerdas. Otomatisasi notifikasi e-wallet dan OCR struk belanja fisik.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CelenganKita",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased flex flex-col items-center">
        <PWARegister />
        {/* Container Mobile PWA: Maksimum lebar mobile responsif */}
        <main className="w-full max-w-md min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative border-x border-slate-100 dark:border-slate-800">
          {children}
        </main>
      </body>
    </html>
  );
}
