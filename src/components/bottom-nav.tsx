"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, BellRing, Settings, Receipt } from "lucide-react";

interface BottomNavProps {
  pendingCount?: number;
}

export default function BottomNav({ pendingCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dasbor",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Validasi",
      href: "/validations",
      icon: BellRing,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      label: "Catat",
      href: "/transactions/new",
      icon: PlusCircle,
      isPrimary: true,
    },
    {
      label: "Riwayat",
      href: "/transactions",
      icon: Receipt,
    },
    {
      label: "Pengaturan",
      href: "/space/settings",
      icon: Settings,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Utama"
      className="sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1 safe-bottom z-40 select-none"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label="Catat Transaksi Baru"
                className="flex flex-col items-center -mt-5 group min-w-[56px] min-h-[56px] justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 group-active:scale-95 transition">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={
                item.badge
                  ? `${item.label}, ${item.badge} notifikasi membutuhkan validasi`
                  : item.label
              }
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 px-2 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" aria-hidden="true" />
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
