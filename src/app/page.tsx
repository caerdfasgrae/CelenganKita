import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PenguinMascot } from "@/components/ui/penguin-mascot";
import { InteractiveFlowPreview } from "@/components/landing/interactive-flow-preview";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col justify-between px-5 pt-safe pb-8 space-y-6">
      {/* Header / Brand with Pingu & Penga */}
      <header className="flex items-center justify-between pt-2 sm:pt-3">
        <div className="flex items-center gap-2.5">
          <PenguinMascot variant="pair" expression="happy" size="sm" />
          <div>
            <span className="font-black text-lg tracking-tight text-warm-espresso block leading-tight">
              CelenganKita
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Saling Jaga, Saling Isi
            </span>
          </div>
        </div>
        <Link
          href="/login"
          className="min-h-[44px] inline-flex items-center text-xs font-bold px-3.5 py-1.5 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-200/50 transition active:scale-95"
        >
          Masuk
        </Link>
      </header>

      {/* Hero Section (Human, Real Couple Story) */}
      <section className="text-center space-y-4 pt-1">
        <div className="space-y-1.5">
          <span className="text-xs font-bold tracking-wider text-orange-600 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
            Tadi siapa yang bayar makan malam?
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-warm-espresso leading-tight tracking-tight">
            Uang jajan berdua, <br />
            <span className="text-orange-600">dicatat bareng tanpa drama</span>
          </h1>
        </div>

        <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
          Nggak perlu lagi saling tagih atau scroll riwayat m-banking. Cukup foto nota kasir atau teruskan pesan, catatan kalian langsung rapi di satu celengan.
        </p>

        {/* Interactive "Show, Don't Tell" Flow Preview */}
        <div className="pt-2">
          <InteractiveFlowPreview />
        </div>
      </section>

      {/* CTA Bottom Buttons */}
      <footer className="space-y-2 safe-bottom pt-2">
        <Link
          href="/register"
          className="w-full min-h-[48px] rounded-xl bg-[#FFA259] hover:bg-[#F97316] text-stone-900 font-black text-sm shadow-md shadow-orange-950/10 border border-orange-300 flex items-center justify-center transition active:scale-[0.98]"
        >
          Mulai Celengan Berdua
        </Link>
        <p className="text-center text-[11px] text-stone-500 font-medium">
          Tersedia di web browser HP maupun aplikasi Android.
        </p>
      </footer>
    </div>
  );
}
