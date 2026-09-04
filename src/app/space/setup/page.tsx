"use client";

import { useState, useTransition } from "react";
import { PlusCircle, UserPlus, Heart, AlertCircle } from "lucide-react";
import { createNewSpace, joinExistingSpace } from "@/app/space/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SpaceSetupPage() {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createNewSpace(formData);
      if (res?.error) setError(res.error);
    });
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await joinExistingSpace(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* Header */}
      <div className="text-center pt-6 space-y-2">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
          <Heart className="w-6 h-6 fill-emerald-600 dark:fill-emerald-400" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Ruang Anggaran Bersama
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Pilih untuk membuat dompet bersama baru atau bergabung ke dompet yang sudah dibuat pasanganmu.
        </p>
      </div>

      {/* Switcher Tab (Normalisasi rounded-lg) */}
      <div
        role="tablist"
        aria-label="Pilih opsi ruang anggaran"
        className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg grid grid-cols-2 gap-1 my-4 select-none"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "create"}
          onClick={() => {
            setTab("create");
            setError(null);
          }}
          className={`min-h-[40px] text-xs font-bold rounded-lg transition ${
            tab === "create"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Buat Ruang Baru
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "join"}
          onClick={() => {
            setTab("join");
            setError(null);
          }}
          className={`min-h-[40px] text-xs font-bold rounded-lg transition ${
            tab === "join"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Gabung Pasangan
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 mb-4"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="my-auto">
        {tab === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              id="space-name-input"
              name="spaceName"
              type="text"
              required
              maxLength={100}
              label="Nama Ruang / Celengan"
              placeholder="Contoh: Rumah Impian / Celengan Bersama"
            />

            <Input
              id="space-nickname-input"
              name="nickname"
              type="text"
              maxLength={50}
              label="Panggilan Anda di Ruang Ini"
              placeholder="Contoh: Ayah / Papah / Mas"
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              loadingText="Membuat Ruang..."
              className="w-full mt-4"
            >
              <PlusCircle className="w-4 h-4 mr-1" aria-hidden="true" />
              Buat Ruang Sekarang
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              id="space-invite-code-input"
              name="inviteCode"
              type="text"
              maxLength={8}
              required
              label="Kode Undangan dari Pasangan"
              placeholder="8 Huruf Kode (contoh: 8K7A2M9X)"
              helperText="Minta pasanganmu membagikan kode undangan dari dasbor mereka."
              className="font-mono tracking-widest uppercase text-center"
            />

            <Input
              id="space-partner-nickname-input"
              name="nickname"
              type="text"
              maxLength={50}
              label="Panggilan Anda di Ruang Ini"
              placeholder="Contoh: Bunda / Adek"
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              loadingText="Menghubungkan..."
              className="w-full mt-4"
            >
              <UserPlus className="w-4 h-4 mr-1" aria-hidden="true" />
              Gabung ke Ruang Pasangan
            </Button>
          </form>
        )}
      </div>

      <div className="text-center safe-bottom">
        <p className="text-[11px] text-slate-400">
          Setiap pasangan hanya butuh satu orang yang membuat Ruang, dan satu lagi cukup bergabung.
        </p>
      </div>
    </div>
  );
}
