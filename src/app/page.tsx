import Link from "next/link";
import { PiggyBank, Heart, BellRing, ScanLine, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* Header / Brand */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-warm-cream border border-amber-200 flex items-center justify-center text-stone-900 shadow-xs">
            <PiggyBank className="w-5 h-5 text-orange-700" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-warm-espresso block leading-tight">
              CelenganKita
            </span>
            <span className="flex items-center text-[11px] text-warm-coral font-bold gap-1">
              Khusus Berdua <Heart className="w-2.5 h-2.5 fill-warm-coral" />
            </span>
          </div>
        </div>
        <Link
          href="/login"
          className="text-xs font-bold px-3.5 py-1.5 rounded-xl border border-warm-border bg-white text-stone-800 hover:bg-[#FFFDF8] hover:border-warm-apricot transition shadow-2xs"
        >
          Masuk
        </Link>
      </div>

      {/* Hero Section */}
      <div className="my-auto py-6 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5DC] border border-amber-200 text-stone-800 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          Keuangan Rumah Tangga & Pasangan · Hangat & Terbuka
        </div>

        <h1 className="text-3xl font-black text-warm-espresso leading-tight tracking-tight">
          Catat Belanja Berdua, <br />
          <span className="text-orange-600">Makin Dekat & Rukun</span>
        </h1>

        <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
          Kelola uang bareng pasangan tanpa ribet dan tanpa saling curiga. Pindai foto nota belanja dan sambungkan catatan pengeluaran harian kalian berdua.
        </p>

        {/* Feature Highlights (Warm, inviting, human cards) */}
        <div className="grid grid-cols-1 gap-2.5 pt-2 text-left">
          <div className="p-3.5 rounded-2xl bg-white border border-warm-border flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-[#FFF9EC] border border-amber-100 text-orange-600 shrink-0">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-warm-espresso">
                Tersambung Notifikasi HP
              </h3>
              <p className="text-[11px] text-stone-500 leading-normal mt-0.5">
                Belanjaan dari m-banking atau e-wallet langsung tercatat rapi tanpa harus ketik ulang satu per satu.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-warm-border flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-[#FFF9EC] border border-amber-100 text-orange-600 shrink-0">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-warm-espresso">
                Foto Nota & Struk Belanja
              </h3>
              <p className="text-[11px] text-stone-500 leading-normal mt-0.5">
                Cukup foto struk belanjaan minimarket atau resto, nominal dan tokonya langsung terisi otomatis.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-warm-border flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-warm-coral shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-warm-espresso">
                Aman & Privat Khusus Berdua
              </h3>
              <p className="text-[11px] text-stone-500 leading-normal mt-0.5">
                Data keuangan tersimpan aman. Hanya kamu dan pasanganmu yang punya akses membuka celengan ini.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Bottom Buttons */}
      <div className="space-y-2 safe-bottom">
        <Link
          href="/register"
          className="w-full h-12 rounded-xl bg-[#FFA259] hover:bg-[#F97316] text-stone-900 font-extrabold text-sm shadow-md shadow-orange-950/10 border border-orange-300 flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          Mulai Celengan Berdua
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-[11px] text-stone-500 font-medium">
          Bisa dipasang langsung di layar utama HP (PWA) tanpa download dari app store.
        </p>
      </div>
    </div>
  );
}
