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
      label: "Tinjau",
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
      className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-warm-border px-3 py-1 safe-bottom z-40 select-none shadow-sm"
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
                prefetch={true}
                aria-current={isActive ? "page" : undefined}
                aria-label="Catat Belanja Baru"
                className="flex flex-col items-center -mt-3.5 group min-w-[56px] min-h-[56px] justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-apricot rounded-xl active:scale-95 transition-transform duration-75"
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-100 ${
                    isActive
                      ? "bg-warm-apricot text-stone-950 font-black shadow-md shadow-orange-950/20 border border-orange-400 scale-105"
                      : "bg-[#FFF9EE] text-stone-700 border border-amber-200/90 shadow-2xs hover:bg-[#FFECC2]"
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <span
                  className={`text-[10px] mt-1 tracking-tight ${
                    isActive
                      ? "text-orange-600 font-extrabold"
                      : "text-stone-500 font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-current={isActive ? "page" : undefined}
              aria-label={
                item.badge
                  ? `${item.label}, ${item.badge} catatan menunggu ditinjau`
                  : item.label
              }
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 px-2 rounded-lg transition-transform duration-75 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-apricot ${
                isActive
                  ? "text-orange-600 font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" aria-hidden="true" />
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2.5 bg-[#FF7E7E] text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
