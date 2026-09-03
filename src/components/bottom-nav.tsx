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
    <nav className="sticky bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 safe-bottom z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 group-active:scale-95 transition">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center relative py-1 px-2 transition ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
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
