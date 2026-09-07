"use client";

import { useState, useRef, useEffect } from "react";
import {
  BellRing,
  Camera,
  Heart,
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
    if (width <= 0) return;
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
    <div className="w-full space-y-3.5 select-none">
      {/* Horizontal Snap Carousel Frame */}
      <div className="rounded-3xl bg-white border border-warm-border p-4 sm:p-5 shadow-sm overflow-hidden">
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
          className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-none gap-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* SLIDE 1: Notifikasi HP Otomatis */}
          <div className="w-full min-w-full max-w-full snap-center px-1 shrink-0 space-y-3">
            <div className="flex items-center justify-between pb-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-bold text-stone-900">
                <BellRing className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Otomatisasi Notifikasi HP</span>
              </div>
            </div>

            <div className="min-h-[205px] rounded-2xl bg-[#FFFDF9] border border-stone-200/80 p-3.5 flex flex-col justify-center space-y-2.5">
              {/* Simulated Phone Notification */}
              <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium">
                  <span className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Smartphone className="w-3.5 h-3.5 text-blue-700" />
                    BCA Mobile • Baru Saja
                  </span>
                  <span>08:42</span>
                </div>
                <p className="text-xs font-black text-stone-950">
                  QRIS Rp 45.000 Berhasil
                </p>
                <p className="text-[11px] text-stone-600">
                  Pembayaran ke KOPI KENANGAN telah selesai diproses.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-[10px] font-bold tracking-wide text-stone-800 uppercase bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Tersambung Otomatis ↓
                </span>
              </div>

              {/* Converted into CelenganKita Card */}
              <div className="p-2.5 rounded-xl bg-[#FFF9EC] border border-amber-200 text-left flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PenguinMascot variant="pingu" expression="happy" size="xs" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-warm-espresso truncate">
                      Kopi Kenangan
                    </p>
                    <p className="text-[11px] text-stone-600 font-medium truncate">
                      Masuk antrean kas bersama • Siap disetujui berdua
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-900 tabular-nums shrink-0 ml-2">
                  - Rp 45.000
                </span>
              </div>
            </div>
          </div>

          {/* SLIDE 2: Foto Nota & Struk Belanja */}
          <div className="w-full min-w-full max-w-full snap-center px-1 shrink-0 space-y-3">
            <div className="flex items-center justify-between pb-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950">
                <Camera className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Foto Nota & Struk Belanja</span>
              </div>
            </div>

            <div className="min-h-[205px] rounded-2xl bg-[#FFFDF9] border border-stone-200/80 p-3.5 flex flex-col justify-center space-y-2.5">
              {/* Simulated Receipt */}
              <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs font-mono text-left space-y-1">
                <div className="flex items-center justify-between border-b border-dashed border-stone-200 pb-1 text-[11px] text-stone-700">
                  <span className="font-bold flex items-center gap-1 text-stone-900">
                    <Receipt className="w-3.5 h-3.5 text-stone-800" />
                    INDOMARET RAWAMANGUN
                  </span>
                  <span>Tadi Siang</span>
                </div>
                <div className="text-[11px] text-stone-700 space-y-0.5 pt-0.5">
                  <div className="flex justify-between">
                    <span>1x SUSU UHT 1L</span>
                    <span className="font-bold">19.500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x ROTI TAWAR</span>
                    <span className="font-bold">16.000</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-dashed border-stone-300 flex justify-between items-center text-xs font-black text-stone-950 bg-stone-100/90 px-1.5 py-0.5 rounded">
                  <span>TOTAL BELANJA:</span>
                  <span className="text-orange-800">Rp 35.500</span>
                </div>
              </div>

              {/* Scan Success Highlight */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left flex items-center gap-2 text-emerald-950 text-xs font-bold shadow-2xs">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] leading-snug">
                  Kamera otomatis membaca total Rp 35.500 tanpa perlu ketik ulang!
                </span>
              </div>
            </div>
          </div>

          {/* SLIDE 3: Khusus Dua Insan (Pingu & Penga) */}
          <div className="w-full min-w-full max-w-full snap-center px-1 shrink-0 space-y-3">
            <div className="flex items-center justify-between pb-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-950">
                <Heart className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Khusus Pasangan Tercinta</span>
              </div>
            </div>

            <div className="min-h-[205px] rounded-2xl bg-[#FFFDF9] border border-stone-200/80 p-3.5 flex flex-col justify-center space-y-2.5 text-center">
              {/* Mascot Duo Visual */}
              <div className="flex justify-center pt-0.5">
                <PenguinMascot variant="pair" expression="happy" size="md" />
              </div>

              {/* Couple Roles Description */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <p className="text-[11px] font-black text-rose-950">Pingu</p>
                  </div>
                  <p className="text-[10px] text-stone-700 leading-snug">
                    Yang teliti mencatat dan menyimpan setiap nota belanja rapi.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <p className="text-[11px] font-black text-blue-950">Penga</p>
                  </div>
                  <p className="text-[10px] text-stone-700 leading-snug">
                    Yang tenang menjaga stabilitas dan tabungan celengan bersama.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-stone-700 font-semibold">
                Satu celengan privat, saling terbuka tanpa rasa curiga 💕
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Pagination Dots & Swipe Hint */}
      <div className="flex items-center justify-between px-1">
        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label="Slide cerita fitur"
        >
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToSlide(idx)}
              aria-label={`Lihat slide fitur ${idx + 1}`}
              className="min-w-[32px] min-h-[32px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-apricot rounded-full"
            >
              <span
                className={`h-2.5 rounded-full transition-all duration-200 block ${
                  currentSlide === idx
                    ? "w-8 bg-warm-apricot shadow-2xs"
                    : "w-2.5 bg-stone-300 hover:bg-stone-400"
                }`}
              />
            </button>
          ))}
        </div>

        <span className="text-[11px] text-stone-500 font-medium flex items-center gap-0.5">
          Geser untuk melihat fitur <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
        </span>
      </div>
    </div>
  );
}
