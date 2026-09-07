"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle, UserPlus, Users, AlertCircle, Sparkles } from "lucide-react";
import { createNewSpace, joinExistingSpace } from "@/app/space/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenguinMascot } from "@/components/ui/penguin-mascot";

function SpaceSetupForm() {
  const searchParams = useSearchParams();
  const codeParam = searchParams?.get("code")?.trim().toUpperCase() || "";

  const [tab, setTab] = useState<"create" | "join">(codeParam ? "join" : "create");
  const [inviteCode, setInviteCode] = useState(codeParam);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (codeParam) {
      setTab("join");
      setInviteCode(codeParam);
    }
  }, [codeParam]);

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
    <div className="flex-1 flex flex-col justify-between pt-safe px-5 pb-6 safe-bottom">
      {/* Header with Pingu & Penga */}
      <div className="text-center pt-2 space-y-2">
        <div className="flex justify-center">
          <PenguinMascot variant="pair" expression="happy" size="md" />
        </div>
        <h1 className="text-2xl font-black text-warm-espresso tracking-tight">
          Mulai Celengan Bersama
        </h1>
        <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
          Bikin celengan baru atau masukkan kode sambung dari pasanganmu untuk mulai mencatat berdua.
        </p>
      </div>

      {/* Switcher Tab */}
      <div
        role="tablist"
        aria-label="Pilih opsi celengan"
        className="bg-[#F7F4EE] border border-warm-border p-1 rounded-2xl grid grid-cols-2 gap-1 my-4 select-none"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "create"}
          onClick={() => {
            setTab("create");
            setError(null);
          }}
          className={`min-h-[44px] text-xs font-bold rounded-xl transition ${
            tab === "create"
              ? "bg-[#FFA259] text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Bikin Celengan Baru
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "join"}
          onClick={() => {
            setTab("join");
            setError(null);
          }}
          className={`min-h-[44px] text-xs font-bold rounded-xl transition ${
            tab === "join"
              ? "bg-[#FFA259] text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Gabung Celengan
        </button>
      </div>

      {codeParam && tab === "join" && (
        <div className="p-3 rounded-2xl bg-[#FFF9EC] border border-amber-200 text-orange-900 text-xs flex items-center gap-2 mb-4 font-medium shadow-2xs">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0" aria-hidden="true" />
          <span>Kode sambung dari pasanganmu terpasang otomatis! Masukkan panggilan kesayanganmu lalu klik gabung.</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4 font-medium"
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
              label="Nama Celengan Bersama"
              placeholder="Contoh: Tabungan Nikah / Celengan Berdua"
            />

            <Input
              id="space-nickname-input"
              name="nickname"
              type="text"
              maxLength={50}
              label="Nama Panggilanmu di Celengan Ini"
              placeholder="Contoh: Ayah / Mas / Sayang"
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              loadingText="Menyiapkan Celengan..."
              className="w-full mt-4 bg-[#FFA259] hover:bg-[#F97316] text-stone-900 font-extrabold rounded-xl border border-orange-300"
            >
              <PlusCircle className="w-4 h-4 mr-1" aria-hidden="true" />
              Mulai Celengan Sekarang
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
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              label="Kode Sambung dari Pasangan"
              placeholder="8 Huruf Kode (contoh: 8K7A2M9X)"
              helperText="Minta pasanganmu membagikan kode sambung dari dasbor mereka."
              className="font-mono tracking-widest uppercase text-center text-lg font-bold"
            />

            <Input
              id="space-partner-nickname-input"
              name="nickname"
              type="text"
              maxLength={50}
              label="Nama Panggilanmu di Celengan Ini"
              placeholder="Contoh: Bunda / Adek / Sayang"
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              loadingText="Menyambungkan..."
              className="w-full mt-4 bg-[#FFA259] hover:bg-[#F97316] text-stone-900 font-extrabold rounded-xl border border-orange-300"
            >
              <UserPlus className="w-4 h-4 mr-1" aria-hidden="true" />
              Gabung ke Celengan Pasangan
            </Button>
          </form>
        )}
      </div>

      <div className="text-center safe-bottom pt-4">
        <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
          Cukup salah satu yang membuat celengan, pasangan tinggal memasukkan kode sambung untuk mulai mencatat berdua.
        </p>
      </div>
    </div>
  );
}

export default function SpaceSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-6 text-xs text-stone-500 font-medium">
          Memuat pengaturan celengan...
        </div>
      }
    >
      <SpaceSetupForm />
    </Suspense>
  );
}
