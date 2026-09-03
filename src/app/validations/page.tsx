import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import ValidationItem from "./validation-item";
import { BellRing, CheckCircle2, ChevronLeft, Sparkles, Smartphone } from "lucide-react";
import { Category, PendingValidation } from "@/types/database";

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
      <div className="p-5 space-y-4 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                Antrean Validasi Notif
              </h1>
              <p className="text-[11px] text-slate-500">
                Fitur 1: Sinkronisasi Otomatis Android
              </p>
            </div>
          </div>

          <Link
            href="/space/settings#webhook"
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Setup HP
          </Link>
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <p className="leading-tight text-[11px]">
            Data di bawah ditangkap otomatis oleh MacroDroid saat notifikasi m-banking/e-wallet masuk. Anda tinggal klik <strong>Setuju Catat</strong> atau <strong>Tolak</strong>.
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
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Semua Notifikasi Bersih!
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Tidak ada antrean validasi baru yang tertunda. Notifikasi transaksi baru dari ponsel akan otomatis muncul di sini.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav pendingCount={pendingItems?.length || 0} />
    </div>
  );
}
