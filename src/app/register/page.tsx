"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { signup } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenguinMascot } from "@/components/ui/penguin-mascot";

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
          className="flex items-center gap-2 group"
          aria-label="Kembali ke Beranda"
        >
          <div className="w-10 h-10 rounded-xl bg-warm-cream border border-amber-200 flex items-center justify-center text-orange-700 shadow-2xs group-hover:border-amber-300 transition">
            <PenguinMascot variant="pair" size="xs" />
          </div>
          <span className="font-extrabold text-warm-espresso text-base tracking-tight">
            CelenganKita
          </span>
        </Link>
      </div>

      {/* Main Form */}
      <div className="my-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-warm-espresso tracking-tight">
            Mulai Celengan Bersama
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Buat akun untuk memulai celengan dan mengundang pasanganmu.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium"
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
            placeholder="Contoh: Budi / Mas Budi"
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
            className="w-full mt-2 bg-[#FFA259] hover:bg-[#F97316] text-stone-900 font-extrabold rounded-xl border border-orange-300"
          >
            Daftar & Buat Celengan
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Footer link */}
      <div className="text-center safe-bottom">
        <p className="text-xs text-stone-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-orange-600 hover:underline">
            Masuk di Sini
          </Link>
        </p>
      </div>
    </div>
  );
}
