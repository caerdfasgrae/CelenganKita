import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import ValidationItem from "./validation-item";
import { BellRing, CheckCircle2, ChevronLeft, Sparkles, Smartphone } from "lucide-react";
import { Category, PendingValidation } from "@/types/database";
import { PenguinMascot } from "@/components/ui/penguin-mascot";
import { MobileHeader } from "@/components/ui/mobile-header";

export default async function ValidationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil Space aktif
  const { data: memberRecord } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    redirect("/space/setup");
  }

  const spaceId = memberRecord.space_id;

  // Ambil data antrean validasi yang masih 'pending'
  const { data: pendingItems } = await supabase
    .from("pending_validations")
    .select("*")
    .eq("space_id", spaceId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Ambil daftar kategori
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,space_id.eq.${spaceId}`)
    .order("name");

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Mobile Ergonomic App Bar */}
      <MobileHeader
        title="Tinjau Belanja"
        subtitle="Notifikasi HP & Dompet Digital"
        backHref="/dashboard"
        rightAction={
          <Link
            href="/space/settings#webhook"
            aria-label="Atur sambungan notifikasi HP"
            className="text-xs font-bold px-3 py-2 min-h-[44px] rounded-xl bg-white border border-warm-border text-stone-700 flex items-center gap-1.5 hover:border-warm-apricot hover:text-stone-900 transition-transform duration-75 active:scale-95 shadow-2xs"
          >
            <Smartphone className="w-4 h-4 text-orange-600" />
            <span>Sambungan HP</span>
          </Link>
        }
      />

      <div className="px-4 py-3 space-y-4 flex-1 pb-28">

        {/* Info Banner */}
        <div className="p-3.5 rounded-2xl bg-[#FFF9EC] border border-amber-200 text-stone-800 text-xs flex items-start gap-2.5 shadow-2xs">
          <Sparkles className="w-4 h-4 shrink-0 text-orange-600 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-stone-600">
            Belanjaan dari notifikasi HP tersimpan di sini dulu. Kalian berdua bisa memeriksa dan memilih untuk memasukkannya ke kas bersama atau abaikan.
          </p>
        </div>

        {/* List of Pending Items */}
        {pendingItems && pendingItems.length > 0 ? (
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <ValidationItem
                key={item.id}
                item={item as PendingValidation}
                categories={(categories || []) as Category[]}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-warm-border p-6 shadow-2xs">
            <div className="flex justify-center">
              <PenguinMascot variant="pair" expression="celebrate" size="md" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-warm-espresso">
                Semua Belanjaan Sudah Ditinjau Berdua 💕
              </h3>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto mt-1 leading-relaxed">
                Hore, Pingu & Penga senang semua catatan belanja sudah rapi! Belum ada notifikasi baru yang tertunda.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav pendingCount={pendingItems?.length || 0} />
    </div>
  );
}
