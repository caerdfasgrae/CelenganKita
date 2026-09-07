"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenguinMascot } from "@/components/ui/penguin-mascot";
import {
  LayoutDashboard,
  Receipt,
  BellRing,
  Settings,
  PlusCircle,
  Camera,
  Users,
} from "lucide-react";

interface DesktopHeaderProps {
  spaceName?: string;
  isPartnerConnected?: boolean;
  pendingCount?: number;
}

export function DesktopHeader({
  spaceName = "Celengan Bersama",
  isPartnerConnected = false,
  pendingCount = 0,
}: DesktopHeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      label: "Dasbor",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Riwayat Belanja",
      href: "/transactions",
      icon: Receipt,
    },
    {
      label: "Tinjau Belanja",
      href: "/validations",
      icon: BellRing,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      label: "Pengaturan",
      href: "/space/settings",
      icon: Settings,
    },
  ];

  return (
    <header className="hidden md:block w-full bg-white/90 backdrop-blur-md border-b border-warm-border/80 sticky top-0 z-40 select-none">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Brand & Space Context */}
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group transition active:scale-95"
            aria-label="Kembali ke Dasbor CelenganKita"
          >
            <PenguinMascot variant="pair" expression="happy" size="sm" />
            <div>
              <span className="font-black text-base tracking-tight text-warm-espresso block leading-tight group-hover:text-orange-600 transition">
                CelenganKita
              </span>
              <span className="text-[10px] text-stone-500 font-medium block">
                Saling Jaga, Saling Isi
              </span>
            </div>
          </Link>

          <div className="h-6 w-px bg-stone-200" aria-hidden="true" />

          {/* Space Pill with Partner Status */}
          <Link
            href="/space/settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 hover:bg-stone-100/80 border border-stone-200 transition text-xs font-bold text-stone-800"
            title="Kelola Ruang Celengan dan Pasangan"
          >
            <span className="truncate max-w-[140px] font-extrabold text-warm-espresso">
              {spaceName}
            </span>
            {isPartnerConnected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Berdua 💕
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                <Users className="w-3 h-3 text-orange-600" />
                + Pasangan
              </span>
            )}
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          aria-label="Navigasi Desktop"
          className="flex items-center gap-1 bg-stone-100/70 p-1 rounded-2xl border border-stone-200/70"
        >
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-white text-stone-900 shadow-2xs font-black"
                    : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-orange-600" : "text-stone-500"
                  }`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/transactions/new?mode=ocr"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold shadow-2xs transition active:scale-95"
            title="Pindai foto nota atau struk belanja"
          >
            <Camera className="w-3.5 h-3.5 text-stone-600" aria-hidden="true" />
            <span>Foto Nota</span>
          </Link>

          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFA259] hover:bg-[#F97316] text-stone-950 text-xs font-black shadow-2xs border border-orange-300 transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Catat Belanja</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
