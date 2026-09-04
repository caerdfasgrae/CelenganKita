import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import SettingsView from "./settings-view";
import { ChevronLeft } from "lucide-react";
import { Space, SpaceMember, Category } from "@/types/database";

export default async function SpaceSettingsPage() {
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
    .select("space_id, spaces(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!memberRecord || !memberRecord.spaces) {
    redirect("/space/setup");
  }

  const space = memberRecord.spaces as any;

  // Ambil semua anggota
  const { data: members } = await supabase
    .from("space_members")
    .select("*, profiles(*)")
    .eq("space_id", space.id);

  // Ambil kategori kustom milik space ini
  const { data: customCategories } = await supabase
    .from("categories")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: true });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="p-5 space-y-4 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2.5 pt-2">
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-xl bg-white border border-warm-border flex items-center justify-center text-stone-600 hover:text-warm-espresso hover:border-warm-apricot transition shadow-2xs"
            aria-label="Kembali ke Dasbor"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-warm-espresso tracking-tight">
              Pengaturan Celengan
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">
              Pasangan, Kategori & Sambungan HP
            </p>
          </div>
        </div>

        <SettingsView
          space={space as Space}
          members={(members || []) as SpaceMember[]}
          initialCustomCategories={(customCategories || []) as Category[]}
          siteUrl={siteUrl}
        />
      </div>

      <BottomNav />
    </div>
  );
}
