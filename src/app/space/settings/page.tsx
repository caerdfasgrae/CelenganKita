import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import SettingsView from "./settings-view";
import { ChevronLeft } from "lucide-react";
import { Space, SpaceMember, Category } from "@/types/database";
import { MobileHeader } from "@/components/ui/mobile-header";
import { DesktopHeader } from "@/components/ui/desktop-header";

export default async function SpaceSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil Space yang diikuti user
  const { data: memberRecord } = await supabase
    .from("space_members")
    .select("space_id, role, nickname, spaces(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!memberRecord || !memberRecord.spaces) {
    redirect("/space/setup");
  }

  const space = memberRecord.spaces as any;

  // Ambil semua anggota di Space ini
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
      {/* Desktop Top Header Navigation */}
      <DesktopHeader spaceName={space.name} isPartnerConnected={Boolean(members && members.length >= 2)} />

      {/* Mobile Ergonomic App Bar */}
      <MobileHeader
        hideOnDesktop={true}
        title="Pengaturan"
        subtitle="Kelola Pasangan & Kategori Belanja"
        backHref="/dashboard"
      />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 flex-1 pb-28 md:pb-12">

        <SettingsView
          space={space as Space}
          members={(members || []) as SpaceMember[]}
          initialCustomCategories={(customCategories || []) as Category[]}
          siteUrl={siteUrl}
          currentUserId={user.id}
        />
      </div>

      <BottomNav />
    </div>
  );
}
