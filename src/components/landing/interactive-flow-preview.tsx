"use client";

import { useState } from "react";
import { BellRing, Camera, Heart, CheckCircle2, Sparkles, Smartphone, Receipt } from "lucide-react";
import { PiggyMascot } from "@/components/ui/piggy-mascot";

export function InteractiveFlowPreview() {
  const [activeTab, setActiveTab] = useState<"notification" | "receipt" | "couple">("notification");

  return (
    <div className="w-full rounded-3xl bg-white border border-warm-border p-4 shadow-sm space-y-4">
      {/* Tab Switcher */}
      <div className="flex rounded-2xl bg-[#F7F4EE] p-1 border border-warm-border gap-1 select-none">
        <button
          type="button"
          onClick={() => setActiveTab("notification")}
          className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "notification"
              ? "bg-[#FFA259] text-stone-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <BellRing className="w-3.5 h-3.5 shrink-0" />
          <span>Notifikasi HP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("receipt")}
          className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "receipt"
              ? "bg-[#FFA259] text-stone-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span>Foto Nota</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("couple")}
          className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "couple"
              ? "bg-[#FFA259] text-stone-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <Heart className="w-3.5 h-3.5 shrink-0 text-warm-coral" />
          <span>Khusus Berdua</span>
        </button>
      </div>

      {/* Visual Canvas (Show, Don't Tell) */}
      <div className="min-h-[220px] rounded-2xl bg-[#FFFDF9] border border-amber-100 p-4 flex flex-col justify-center relative overflow-hidden">
        {activeTab === "notification" && (
          <div className="space-y-3">
            {/* Simulated Phone Notification */}
            <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1 text-left relative">
              <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
                <span className="flex items-center gap-1 font-bold text-blue-700">
                  <Smartphone className="w-3 h-3 text-blue-600" />
                  BCA Mobile • Baru Saja
                </span>
                <span>08:42</span>
              </div>
              <p className="text-xs font-bold text-stone-900">
                QRIS Rp 45.000 Berhasil
              </p>
              <p className="text-[11px] text-stone-500">
                Pembayaran ke KOPI KENANGAN telah selesai diproses.
              </p>
            </div>

            {/* Arrow Flow */}
            <div className="flex items-center justify-center gap-2 text-stone-400">
              <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Tersambung Otomatis
              </span>
            </div>

            {/* Converted into CelenganKita Card */}
            <div className="p-3 rounded-2xl bg-[#FFF9EC] border border-amber-200 text-left flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <PiggyMascot expression="eating" size="sm" />
                <div>
                  <p className="text-xs font-bold text-warm-espresso">
                    Kopi Kenangan
                  </p>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Masuk antrean kas bersama • Siap disetujui berdua
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-warm-coral tabular-nums shrink-0">
                - Rp 45.000
              </span>
            </div>
          </div>
        )}

        {activeTab === "receipt" && (
          <div className="space-y-3">
            {/* Simulated Receipt */}
            <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-xs font-mono text-left space-y-1">
              <div className="flex items-center justify-between border-b border-dashed border-stone-200 pb-1 text-[10px] text-stone-600">
                <span className="font-bold flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-stone-700" />
                  INDOMARET RAWAMANGUN
                </span>
                <span>Tadi Siang</span>
              </div>
              <div className="text-[11px] text-stone-600 space-y-0.5 pt-0.5">
                <div className="flex justify-between">
                  <span>1x SUSU UHT 1L</span>
                  <span>19.500</span>
                </div>
                <div className="flex justify-between">
                  <span>1x ROTI TAWAR</span>
                  <span>16.000</span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-dashed border-stone-300 flex justify-between items-center text-xs font-black text-stone-900 bg-amber-50/80 px-1 rounded">
                <span>TOTAL BELANJA:</span>
                <span className="text-orange-700">Rp 35.500</span>
              </div>
            </div>

            {/* Resulting Scan */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left flex items-center gap-2 text-emerald-900 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kamera otomatis mengisi nominal Rp 35.500 tanpa perlu ketik ulang!</span>
            </div>
          </div>
        )}

        {activeTab === "couple" && (
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-center gap-4 py-1">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-orange-700 font-extrabold text-sm mx-auto shadow-2xs">
                  A
                </div>
                <span className="text-[11px] font-bold text-stone-700 mt-1 block">Ayah</span>
                <span className="text-[9px] text-stone-400 font-medium">Owner</span>
              </div>

              <div className="text-center px-1">
                <Heart className="w-5 h-5 text-warm-coral fill-warm-coral" />
                <span className="text-[9px] font-bold text-orange-600 uppercase block mt-1">Berdua</span>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 font-extrabold text-sm mx-auto shadow-2xs">
                  B
                </div>
                <span className="text-[11px] font-bold text-stone-700 mt-1 block">Bunda</span>
                <span className="text-[9px] text-stone-400 font-medium">Partner</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-warm-border text-center space-y-1 shadow-2xs">
              <p className="text-xs font-bold text-warm-espresso">
                Saling Percaya, Selalu Terbuka
              </p>
              <p className="text-[11px] text-stone-600 leading-normal">
                Setiap rupiah yang dicatat langsung bisa dilihat dan ditinjau berdua secara adil.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trust Micro-Badge */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 font-medium pt-1">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Tanpa Iklan
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Privat Berdua
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Gratis Selamanya
        </span>
      </div>
    </div>
  );
}
