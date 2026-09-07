"use client";

import { useState, useRef, useEffect } from "react";
import {
  BellRing,
  Camera,
  Heart,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Receipt,
  ChevronRight,
} from "lucide-react";
import { PenguinMascot } from "@/components/ui/penguin-mascot";

export function InteractiveFlowPreview() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  // Sync currentSlide on scroll
  function handleScroll() {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const width = container.offsetWidth;
    const scrollLeft = container.scrollLeft;
    const index = Math.round(scrollLeft / width);
    if (index !== currentSlide && index >= 0 && index <= 2) {
      setCurrentSlide(index);
    }
  }

  // Scroll to slide when dot clicked
  function scrollToSlide(index: number) {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    container.scrollTo({
      left: index * container.offsetWidth,
      behavior: "smooth",
    });
    setCurrentSlide(index);
  }

  // Auto-advance every 5 seconds unless user is interacting
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isInteractingRef.current && scrollContainerRef.current) {
        const nextSlide = (currentSlide + 1) % 3;
        scrollToSlide(nextSlide);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  return (
    <div className="w-full space-y-3 select-none">
      {/* Horizontal Snap Carousel */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={() => {
          isInteractingRef.current = true;
        }}
        onTouchEnd={() => {
          setTimeout(() => {
            isInteractingRef.current = false;
          }, 3000);
        }}
        className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-3xl bg-white border border-warm-border p-4 shadow-sm"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* SLIDE 1: Notifikasi HP Otomatis */}
        <div className="w-full min-w-full snap-center space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-orange-800">
              <BellRing className="w-3 h-3 text-orange-600 shrink-0" />
              <span>Otomatisasi Notifikasi HP</span>
            </div>
            <span className="text-[10px] font-bold text-stone-400">1 / 3</span>
          </div>

          <div className="min-h-[200px] rounded-2xl bg-[#FFFDF9] border border-amber-100 p-3.5 flex flex-col justify-center space-y-2.5">
            {/* Simulated Phone Notification */}
            <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1 text-left">
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
              <p className="text-[10px] text-stone-500">
                Pembayaran ke KOPI KENANGAN telah selesai diproses.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <span className="text-[9px] font-black tracking-wider text-orange-700 uppercase bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200/80">
                Tersambung Otomatis ↓
              </span>
            </div>

            {/* Converted into CelenganKita Card */}
            <div className="p-2.5 rounded-xl bg-[#FFF9EC] border border-amber-200 text-left flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <PenguinMascot variant="pingu" expression="happy" size="xs" />
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
        </div>

        {/* SLIDE 2: Foto Nota & Struk Belanja */}
        <div className="w-full min-w-full snap-center space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
              <Camera className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Foto Nota & Struk Belanja</span>
            </div>
            <span className="text-[10px] font-bold text-stone-400">2 / 3</span>
          </div>

          <div className="min-h-[200px] rounded-2xl bg-[#FFFDF9] border border-amber-100 p-3.5 flex flex-col justify-center space-y-2.5">
            {/* Simulated Receipt */}
            <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs font-mono text-left space-y-1">
              <div className="flex items-center justify-between border-b border-dashed border-stone-200 pb-1 text-[10px] text-stone-600">
                <span className="font-bold flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-stone-700" />
                  INDOMARET RAWAMANGUN
                </span>
                <span>Tadi Siang</span>
              </div>
              <div className="text-[10px] text-stone-600 space-y-0.5 pt-0.5">
                <div className="flex justify-between">
                  <span>1x SUSU UHT 1L</span>
                  <span>19.500</span>
                </div>
                <div className="flex justify-between">
                  <span>1x ROTI TAWAR</span>
                  <span>16.000</span>
                </div>
              </div>
              <div className="pt-1 border-t border-dashed border-stone-300 flex justify-between items-center text-xs font-black text-stone-900 bg-amber-50/80 px-1 rounded">
                <span>TOTAL BELANJA:</span>
                <span className="text-orange-700">Rp 35.500</span>
              </div>
            </div>

            {/* Scan Success Highlight */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left flex items-center gap-2 text-emerald-900 text-xs font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] leading-snug">
                Kamera otomatis membaca total Rp 35.500 tanpa perlu ketik ulang!
              </span>
            </div>
          </div>
        </div>

        {/* SLIDE 3: Khusus Dua Insan (Pingu & Penga) */}
        <div className="w-full min-w-full snap-center space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800">
              <Heart className="w-3 h-3 text-warm-coral shrink-0" />
              <span>Khusus Pasangan Tercinta</span>
            </div>
            <span className="text-[10px] font-bold text-stone-400">3 / 3</span>
          </div>

          <div className="min-h-[200px] rounded-2xl bg-[#FFFDF9] border border-amber-100 p-3.5 flex flex-col justify-center space-y-2.5 text-center">
            {/* Mascot Duo Visual */}
            <div className="flex justify-center pt-0.5">
              <PenguinMascot variant="pair" expression="happy" size="md" />
            </div>

            {/* Couple Roles Description */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100 space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <p className="text-[10px] font-bold text-warm-coral">Pingu</p>
                </div>
                <p className="text-[9px] text-stone-600 leading-snug">
                  Yang teliti mencatat dan menyimpan nota rapi.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <p className="text-[10px] font-bold text-blue-700">Penga</p>
                </div>
                <p className="text-[9px] text-stone-600 leading-snug">
                  Yang tenang menjaga stabilitas celengan bersama.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-stone-500 font-medium">
              Satu celengan privat, saling terbuka tanpa rasa curiga 💕
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Pagination Dots & Swipe Hint */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide cerita fitur">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToSlide(idx)}
              aria-label={`Lihat slide fitur ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-200 ${
                currentSlide === idx
                  ? "w-6 bg-warm-apricot"
                  : "w-2 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          ))}
        </div>

        <span className="text-[10px] text-stone-400 font-medium flex items-center gap-0.5">
          Geser untuk melihat fitur <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {/* Trust Micro-Badge */}
      <div className="flex items-center justify-center gap-3.5 text-[11px] text-stone-500 font-medium pt-1">
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
