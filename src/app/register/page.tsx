"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PiggyBank, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { signup } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <Link
          href="/"
          className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Kembali ke Beranda"
        >
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
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="register-fullname"
            name="fullName"
            type="text"
            label="Nama Lengkap / Panggilan"
            required
            autoComplete="name"
            placeholder="Contoh: Budi Pratama"
            icon={<User className="w-4 h-4" />}
          />

          <Input
            id="register-email"
            name="email"
            type="email"
            label="Email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            id="register-password"
            name="password"
            type="password"
            label="Kata Sandi"
            required
            autoComplete="new-password"
            placeholder="Minimal 6 karakter"
            helperText="Gunakan minimal 6 karakter kombinasi huruf dan angka"
            icon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            isLoading={isPending}
            loadingText="Mendaftarkan Akun..."
            className="w-full mt-2"
          >
            Daftar & Buat Celengan
            <ArrowRight className="w-4 h-4" />
          </Button>
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
