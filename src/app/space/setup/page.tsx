"use client";

import { useState, useTransition } from "react";
import { PlusCircle, UserPlus, Heart, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { createNewSpace, joinExistingSpace } from "@/app/space/actions";

export default function SpaceSetupPage() {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createNewSpace(formData);
      if (res?.error) setError(res.error);
    });
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
          <Heart className="w-6 h-6 fill-emerald-600 dark:fill-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Ruang Anggaran Bersama
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Pilih untuk membuat dompet bersama baru atau bergabung ke dompet yang sudah dibuat pasanganmu.
        </p>
      </div>

      {/* Switcher Tab */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl grid grid-cols-2 gap-1 my-4">
        <button
          type="button"
          onClick={() => {
            setTab("create");
            setError(null);
          }}
          className={`py-2 text-xs font-bold rounded-xl transition ${
            tab === "create"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Buat Ruang Baru
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("join");
            setError(null);
          }}
          className={`py-2 text-xs font-bold rounded-xl transition ${
            tab === "join"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Gabung Pasangan
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="my-auto">
        {tab === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Ruang / Celengan
              </label>
              <input
                name="spaceName"
                type="text"
                required
                placeholder="Contoh: Abyan & Dinda"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Panggilan Anda di Ruang Ini
              </label>
              <input
                name="nickname"
                type="text"
                placeholder="Contoh: Ayah / Mas Abyan"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98] mt-4"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat Ruang...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Buat Ruang Sekarang
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kode Undangan dari Pasangan
              </label>
              <input
                name="inviteCode"
                type="text"
                maxLength={8}
                required
                placeholder="8 Huruf Kode (contoh: 8K7A2M9X)"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tracking-widest uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
              />
              <p className="text-[11px] text-slate-400 text-center mt-1">
                Minta pasanganmu membagikan kode undangan dari dasbor mereka.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Panggilan Anda di Ruang Ini
              </label>
              <input
                name="nickname"
                type="text"
                placeholder="Contoh: Bunda / Adek"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98] mt-4"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menghubungkan...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Gabung ke Ruang Pasangan
                </>
              )}
            </button>
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
