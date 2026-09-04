import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "CelenganKita - Manajemen Anggaran Bersama Pasangan",
  description: "Aplikasi pencatatan keuangan bersama untuk pasangan. Otomatisasi notifikasi e-wallet dan OCR struk belanja fisik.",
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

// Pastikan memenuhi WCAG 1.4.4: Jangan gunakan userScalable: false atau maximumScale: 1
export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased flex flex-col items-center">
        <PWARegister />
        {/* Container Mobile PWA: Standar utilitas finansial mobile-first */}
        <div className="w-full max-w-md min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative border-x border-slate-200 dark:border-slate-800">
          <main role="main" className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
