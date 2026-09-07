"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Share2,
  Users,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Tag,
  Plus,
  Trash2,
  UserMinus,
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import { removePartner, leaveSpace } from "@/app/space/actions";
import {
  createCustomCategory,
  deleteCustomCategory,
} from "@/app/transactions/actions";
import { Space, SpaceMember, Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PenguinMascot } from "@/components/ui/penguin-mascot";

interface SettingsViewProps {
  space: Space;
  members: SpaceMember[];
  initialCustomCategories?: Category[];
  siteUrl: string;
  currentUserId?: string;
}

export default function SettingsView({
  space,
  members,
  initialCustomCategories = [],
  siteUrl,
  currentUserId,
}: SettingsViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  // Member Management State
  const [memberList, setMemberList] = useState<SpaceMember[]>(members);
  const [memberToRemove, setMemberToRemove] = useState<SpaceMember | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isProcessingMember, setIsProcessingMember] = useState(false);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);

  const currentMember = memberList.find((m) => m.user_id === currentUserId);
  const isOwner = currentMember?.role === "owner";

  async function handleConfirmRemove() {
    if (!memberToRemove) return;
    setIsProcessingMember(true);
    setMemberActionError(null);
    const res = await removePartner(space.id, memberToRemove.user_id);
    setIsProcessingMember(false);
    if (res?.error) {
      setMemberActionError(res.error);
    } else {
      setMemberList((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      setMemberToRemove(null);
    }
  }

  async function handleConfirmLeave() {
    setIsProcessingMember(true);
    setMemberActionError(null);
    const res = await leaveSpace(space.id);
    if (res?.error) {
      setIsProcessingMember(false);
      setMemberActionError(res.error);
    }
  }

  // Custom Categories State
  const [customCategories, setCustomCategories] = useState<Category[]>(initialCustomCategories);
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"expense" | "income">("expense");
  const [catError, setCatError] = useState<string | null>(null);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  function copyInviteCode() {
    navigator.clipboard.writeText(space.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function shareInviteCode() {
    const inviteUrl = `${siteUrl}/space/setup?code=${space.invite_code}`;
    const shareText = `Halo sayang! Yuk gabung ke Celengan Bersama kita di CelenganKita 💕\nBuka tautan ini untuk langsung tersambung:\n👉 ${inviteUrl}\n\nAtau masukkan Kode Celengan kita: ${space.invite_code}`;
    if (navigator.share) {
      navigator.share({
        title: "Undangan CelenganKita",
        text: shareText,
        url: inviteUrl,
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = catName.trim();
    if (!trimmed) {
      setCatError("Nama kategori tidak boleh kosong.");
      return;
    }
    setIsSavingCat(true);
    setCatError(null);
    setCatSuccess(null);

    const res = await createCustomCategory(space.id, trimmed, catType);
    setIsSavingCat(false);
    if (res.error) {
      setCatError(res.error);
    } else if (res.category) {
      setCustomCategories((prev) => [...prev, res.category as Category]);
      setCatName("");
      setCatSuccess(`Kategori "${trimmed}" berhasil ditambahkan.`);
      setTimeout(() => setCatSuccess(null), 3000);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`Hapus kategori kustom "${name}"?`)) return;
    setDeletingCatId(id);
    setCatError(null);
    setCatSuccess(null);

    const res = await deleteCustomCategory(id, space.id);
    setDeletingCatId(null);
    if (res.error) {
      setCatError(res.error);
    } else {
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      setCatSuccess(`Kategori "${name}" berhasil dihapus.`);
      setTimeout(() => setCatSuccess(null), 3000);
    }
  }

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* 1. Grup Celengan Bersama & Anggota */}
      <section
        aria-label="Informasi Celengan dan Pasangan"
        className="rounded-3xl bg-white border border-warm-border p-4 sm:p-5 space-y-4 shadow-2xs"
      >
        {/* Header Space */}
        <div className="flex items-center justify-between pb-3 border-b border-warm-border/60">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
              Celengan Bersama Pasangan
            </span>
            <h2 className="text-lg sm:text-xl font-black text-warm-espresso truncate mt-0.5">
              {space.name}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FFF9EC] border border-amber-200/80 flex items-center justify-center text-orange-600 shadow-2xs shrink-0 ml-3">
            <PenguinMascot variant="pair" size="xs" />
          </div>
        </div>

        {/* Kode Sambung Pasangan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warm-espresso">
              Kode Sambung Pasangan
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Kirim ke pasanganmu
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/50 border border-amber-200/70">
            <span className="font-mono text-lg sm:text-xl font-black tracking-widest text-orange-600 pl-2">
              {space.invite_code}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={copyInviteCode}
                className="min-h-[40px] px-3 rounded-xl bg-white border border-warm-border text-stone-700 hover:text-stone-900 transition active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                title="Salin Kode Sambung"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedCode ? "Tersalin" : "Salin"}</span>
              </button>

              <button
                type="button"
                onClick={shareInviteCode}
                className="min-h-[40px] px-3.5 rounded-xl bg-warm-apricot hover:bg-orange-500 text-stone-900 font-extrabold text-xs border border-orange-300 transition active:scale-95 shadow-2xs flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Undang</span>
              </button>
            </div>
          </div>
        </div>

        {/* Daftar Anggota */}
        <div className="space-y-2 pt-1 border-t border-warm-border/60">
          <span className="text-xs font-bold text-warm-espresso block">
            Pasangan di Celengan Ini
          </span>

          <div className="space-y-2">
            {memberList.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50/60 border border-warm-border text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-orange-700 font-bold flex items-center justify-center text-xs shrink-0">
                    {(m.nickname || m.profile?.full_name || "P").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-warm-espresso truncate">
                      {m.nickname || m.profile?.full_name || "Pasangan"}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium">
                      {m.role === "owner" ? "Pembuat Celengan" : "Pasangan"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-white border border-warm-border text-stone-700 uppercase tracking-wider">
                    {m.role === "owner" ? "Owner" : "Partner"}
                  </span>
                  {isOwner && m.role === "partner" && (
                    <button
                      type="button"
                      onClick={() => setMemberToRemove(m)}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                      title="Keluarkan Pasangan"
                      aria-label={`Keluarkan ${m.nickname || "pasangan"} dari celengan`}
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Keluarkan</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {memberActionError && (
            <div
              role="alert"
              className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{memberActionError}</span>
            </div>
          )}

          {!isOwner && currentMember?.role === "partner" && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar dari Celengan Ini
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. Grup Kategori Belanja Tambahan */}
      <section
        aria-label="Kategori Belanja Tambahan"
        className="rounded-3xl bg-white border border-warm-border p-4 sm:p-5 space-y-4 shadow-2xs"
      >
        <div className="flex items-center gap-2.5 pb-2 border-b border-warm-border/60">
          <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-orange-700 shrink-0">
            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-black text-warm-espresso">
              Kategori Belanja Tambahan
            </h3>
            <p className="text-[10px] text-stone-500 font-medium">
              Bikin kategori khusus belanja berdua
            </p>
          </div>
        </div>

        {/* Form Tambah Kategori */}
        <form onSubmit={handleAddCategory} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">
              Tambah Kategori Baru
            </span>
            {/* Type selector toggle */}
            <div className="flex items-center gap-1 bg-stone-100 border border-warm-border p-0.5 rounded-xl text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setCatType("expense")}
                className={`px-2.5 py-1 rounded-lg transition active:scale-95 ${
                  catType === "expense"
                    ? "bg-[#FF7E7E] text-white shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setCatType("income")}
                className={`px-2.5 py-1 rounded-lg transition active:scale-95 ${
                  catType === "income"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={50}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Contoh: Skincare, Kopi, Jajan..."
              className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-warm-border bg-stone-50/50 text-xs font-medium text-warm-espresso placeholder-stone-400 focus:outline-none focus:bg-white focus:border-warm-apricot focus:ring-1 focus:ring-warm-apricot transition"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              isLoading={isSavingCat}
              className="min-h-[44px] px-4 text-xs font-extrabold shrink-0 rounded-xl bg-warm-apricot hover:bg-orange-500 text-stone-900 border border-orange-300 shadow-2xs active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
          </div>

          {catError && (
            <div
              role="alert"
              className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{catError}</span>
            </div>
          )}

          {catSuccess && (
            <div
              role="status"
              className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{catSuccess}</span>
            </div>
          )}
        </form>

        {/* Daftar Kategori Kustom */}
        <div className="space-y-2 pt-1 border-t border-warm-border/60">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Kategori Kustom Tersimpan ({customCategories.length})
          </span>

          {customCategories.length === 0 ? (
            <p className="text-xs text-stone-500 py-1">
              Belum ada kategori tambahan. 12 kategori bawaan siap dipakai.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {customCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-stone-50 border border-warm-border text-xs"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      cat.type === "expense" ? "bg-warm-coral" : "bg-emerald-500"
                    }`}
                  />
                  <span className="font-bold text-warm-espresso">{cat.name}</span>
                  <button
                    type="button"
                    disabled={deletingCatId === cat.id}
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 transition active:scale-95"
                    title={`Hapus kategori ${cat.name}`}
                    aria-label={`Hapus kategori ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Grup Akun & Sesi */}
      <section aria-label="Kelola Akun" className="pt-2">
        <form action={logout}>
          <button
            type="submit"
            className="w-full min-h-[46px] rounded-2xl border border-rose-200/80 bg-white text-rose-700 hover:bg-rose-50/70 font-bold text-xs shadow-2xs transition active:scale-98 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        </form>
      </section>

      {/* Modal Konfirmasi Keluarkan Pasangan (Khusus Owner) */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        isLoading={isProcessingMember}
        title="Keluarkan Pasangan dari Celengan?"
        description={`Apakah kamu yakin ingin mengeluarkan ${memberToRemove?.nickname || "pasangan"} dari celengan "${space.name}"? Pasangan tidak akan bisa lagi mengakses atau mencatat di celengan ini. Riwayat catatan belanja yang sudah ada tetap tersimpan rapi di kas bersama.`}
        confirmText="Ya, Keluarkan"
        variant="destructive"
      />

      {/* Modal Konfirmasi Keluar dari Celengan (Khusus Partner) */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleConfirmLeave}
        isLoading={isProcessingMember}
        title="Keluar dari Celengan Ini?"
        description={`Apakah kamu yakin ingin keluar dari celengan "${space.name}"? Kamu tidak akan lagi terhubung ke saldo dan catatan bersama pasanganmu. Riwayat transaksi yang pernah kamu catat tetap ada di celengan ini.`}
        confirmText="Ya, Keluar"
        variant="destructive"
      />
    </div>
  );
}
