import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/pwa-register";
import { WarmupClient } from "@/components/warmup-client";

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
  themeColor: "#FFFDF8",
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
      <body className="min-h-screen bg-warm-canvas sm:bg-[#F7F4EE] text-warm-espresso antialiased flex flex-col items-center">
        <PWARegister />
        <WarmupClient />
        {/* Container Mobile: Full Bleed Edge-to-Edge on Mobile, Centered on Desktop */}
        <div className="w-full max-w-full sm:max-w-md min-h-screen bg-warm-canvas text-warm-espresso sm:shadow-xl flex flex-col relative sm:border-x sm:border-warm-border">
          <main role="main" className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
