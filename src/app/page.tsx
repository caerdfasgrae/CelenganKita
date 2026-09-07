import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PenguinMascot } from "@/components/ui/penguin-mascot";
import { InteractiveFlowPreview } from "@/components/landing/interactive-flow-preview";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-6xl mx-auto w-full px-5 sm:px-8 pt-safe pb-8 sm:py-6 lg:py-8 select-none">
      {/* Header / Brand with Pingu & Penga */}
      <header className="flex items-center justify-between pt-3 sm:pt-4 border-b border-warm-border/50 pb-4">
        <div className="flex items-center gap-3">
          <PenguinMascot variant="pair" expression="happy" size="sm" />
          <div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-warm-espresso block leading-tight">
              CelenganKita
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Saling Jaga, Saling Isi 💕
            </span>
          </div>
        </div>

        {/* Real prominent high-contrast button for Masuk */}
        <Link
          href="/login"
          className="min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-bold border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 hover:border-stone-400 shadow-2xs transition active:scale-95 flex items-center justify-center"
        >
          Masuk
        </Link>
      </header>

      {/* Hero Section (Desktop 2-Column, Mobile Stacked) */}
      <main className="flex-1 py-8 sm:py-12 lg:py-16 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Headlines, Above-The-Fold CTA, Trust Badges */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-5 sm:space-y-6">
            {/* Eyebrow Capsule (WCAG AAA contrast, mature tone) */}
            <div className="flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300/90 text-stone-900 text-xs font-bold tracking-wide uppercase shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" aria-hidden="true" />
                Tadi siapa yang bayar makan malam?
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-warm-espresso leading-[1.18] tracking-tight">
              Uang jajan berdua, <br className="hidden sm:inline" />
              <span className="text-orange-600">dicatat bareng tanpa drama</span>
            </h1>

            {/* Description Paragraph */}
            <p className="text-xs sm:text-sm lg:text-base text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Nggak perlu lagi saling tagih atau scroll riwayat m-banking berdua. Cukup foto nota kasir atau teruskan notifikasi, catatan kalian langsung rapi dan transparan di satu celengan bersama.
            </p>

            {/* Primary Action Button (Above the fold on both mobile & desktop) */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <Link
                href="/register"
                className="min-h-[50px] px-8 rounded-xl bg-[#FFA259] hover:bg-[#F97316] text-stone-950 font-black text-sm sm:text-base shadow-md shadow-orange-950/15 border border-orange-300 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <span>Mulai Celengan Berdua</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Trust Badges (Enlarged and Prominent) */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm font-bold text-stone-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                Tanpa Iklan
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                Privat Berdua
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                Gratis Selamanya
              </span>
            </div>
          </div>

          {/* Right Column: Feature Preview / Interactive Carousel Mockup */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none pt-2 lg:pt-0">
            <InteractiveFlowPreview />
          </div>
        </div>
      </main>

      {/* Footer / Caption */}
      <footer className="pt-6 pb-2 border-t border-warm-border/50 text-center text-xs text-stone-500 font-medium">
        Tersedia di web browser HP, laptop, maupun aplikasi Android Native.
      </footer>
    </div>
  );
}
