import Link from "next/link";
import { PiggyBank, Heart, BellRing, ScanLine, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* Header / Brand */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              CelenganKita
            </span>
            <span className="flex items-center text-[10px] text-rose-500 font-semibold gap-0.5">
              Untuk Pasangan <Heart className="w-2.5 h-2.5 fill-rose-500" />
            </span>
          </div>
        </div>
        <Link
          href="/login"
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Masuk
        </Link>
      </div>

      {/* Hero Section */}
      <div className="my-auto py-8 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          Solusi Bebas Ribet & 100% Gratis
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
          Kelola Anggaran Berdua, <br />
          <span className="text-emerald-600 dark:text-emerald-400">Harmonis & Terbuka</span>
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Catat pengeluaran bersama pasangan tanpa manual tiada henti. Otomatisasi notifikasi e-wallet & scan struk belanja fisik.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 gap-3 pt-6 text-left">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Otomatisasi Notifikasi HP
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Tangkap notif BCA, GoPay, ShopeePay, BRI, BNI, & SeaBank langsung masuk antrean konfirmasi.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Scan Struk Belanja & Transfer (OCR)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Foto struk minimarket atau ambil screenshot transfer dari galeri, total otomatis terbaca.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Aman dengan Row-Level Security
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Data keuangan hanya bisa diakses oleh Anda dan pasangan tercinta yang terhubung dalam satu Space.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Bottom Buttons */}
      <div className="space-y-2 safe-bottom">
        <Link
          href="/register"
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          Buat Ruang Anggaran Baru
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Dapat di-install di layar utama HP (PWA) tanpa Play Store.
        </p>
      </div>
    </div>
  );
}
