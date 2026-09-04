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
      <body className="min-h-screen bg-[#F7F4EE] text-warm-espresso antialiased flex flex-col items-center">
        <PWARegister />
        {/* Container Mobile PWA: Warm Cozy Couple Atmosphere */}
        <div className="w-full max-w-md min-h-screen bg-warm-canvas text-warm-espresso shadow-xl flex flex-col relative border-x border-warm-border">
          <main role="main" className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
