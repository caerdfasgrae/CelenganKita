"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PiggyBank, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { signup } from "@/app/auth/actions";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await signup(formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* Top Bar */}
      <div className="flex items-center gap-2 pt-4">
        <Link href="/" className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <PiggyBank className="w-5 h-5" />
        </Link>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          CelenganKita
        </span>
      </div>

      {/* Main Form */}
      <div className="my-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Mulai Anggaran Bersama
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Buat akun untuk memulai ruang dompet dan mengundang pasanganmu.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nama Lengkap / Panggilan
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="fullName"
                type="text"
                required
                placeholder="Contoh: Budi Pratama"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="email"
                type="email"
                required
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                name="password"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mendaftarkan Akun...
              </>
            ) : (
              <>
                Daftar & Buat Celengan
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <div className="text-center safe-bottom">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-emerald-600 hover:underline">
            Masuk di Sini
          </Link>
        </p>
      </div>
    </div>
  );
}
