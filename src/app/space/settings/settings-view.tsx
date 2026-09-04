"use client";

import { useState, useTransition } from "react";
import {
  Copy,
  Check,
  Share2,
  Users,
  Key,
  Smartphone,
  LogOut,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Tag,
  Plus,
  Trash2,
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import { rotateWebhookKey } from "@/app/space/actions";
import {
  createCustomCategory,
  deleteCustomCategory,
} from "@/app/transactions/actions";
import { Space, SpaceMember, Category } from "@/types/database";
import { Button } from "@/components/ui/button";

interface SettingsViewProps {
  space: Space;
  members: SpaceMember[];
  initialCustomCategories?: Category[];
  siteUrl: string;
}

export default function SettingsView({
  space,
  members,
  initialCustomCategories = [],
  siteUrl,
}: SettingsViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedWebhookKey, setCopiedWebhookKey] = useState(false);

  // Kategori Kustom State
  const [customCategories, setCustomCategories] = useState<Category[]>(initialCustomCategories);
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"expense" | "income">("expense");
  const [catError, setCatError] = useState<string | null>(null);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Kunci webhook aktif yang baru di-generate/dirotasi (ditampilkan sekali kepada pengguna)
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [isPendingRotate, startTransition] = useTransition();

  const webhookUrl = `${siteUrl}/api/v1/webhook/notify`;
  const samplePayload = JSON.stringify(
    {
      app: "{notification_package_name}",
      title: "{notification_title}",
      text: "{notification_text}",
    },
    null,
    2
  );

  function copyToClipboard(text: string, type: "code" | "url" | "payload" | "key") {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === "payload") {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else if (type === "key") {
      setCopiedWebhookKey(true);
      setTimeout(() => setCopiedWebhookKey(false), 2000);
    }
  }

  function handleRotateKey() {
    setRotateError(null);
    startTransition(async () => {
      const res = await rotateWebhookKey(space.id);
      if (res.error) {
        setRotateError(res.error);
      } else if (res.token) {
        setRevealedKey(res.token);
      }
    });
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

  const [showIntegration, setShowIntegration] = useState(false);

  function shareInviteCode() {
    const shareText = `Halo sayang! Yuk gabung ke Celengan Bersama kita di CelenganKita 💕 Buka ${siteUrl} lalu masukkan Kode Celengan kita: ${space.invite_code}`;
    if (navigator.share) {
      navigator.share({
        title: "Undangan CelenganKita",
        text: shareText,
        url: siteUrl,
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Space & Pasangan Info Card */}
      <div className="p-5 rounded-3xl bg-white border border-warm-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
              Celengan Bersama Pasangan
            </span>
            <h2 className="text-xl font-extrabold text-warm-espresso tracking-tight">
              {space.name}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FFF9EC] border border-amber-200 flex items-center justify-center text-orange-600 shadow-2xs">
            <Users className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-warm-border space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warm-espresso">
              Kode Sambung Pasangan:
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Kirimkan ke pasanganmu
            </span>
          </div>

          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-warm-border">
            <span className="font-mono text-xl font-black tracking-widest text-orange-600">
              {space.invite_code}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(space.invite_code, "code")}
                className="h-9 px-3 rounded-xl bg-[#F7F4EE] border border-warm-border text-stone-700 hover:text-stone-900 transition flex items-center gap-1.5 text-xs font-bold"
                title="Salin Kode"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? "Tersalin" : "Salin"}
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={shareInviteCode}
                className="h-9 px-3.5 text-xs font-bold bg-[#FFA259] hover:bg-[#F97316] text-stone-900 border border-orange-300 rounded-xl"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Undang
              </Button>
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-warm-espresso">
            Pasangan di Celengan Ini:
          </span>
          <div className="space-y-1.5">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FFFDF9] border border-warm-border text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 text-orange-700 font-bold flex items-center justify-center text-xs">
                    {(m.nickname || m.profile?.full_name || "P").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-warm-espresso">
                      {m.nickname || m.profile?.full_name || "Pasangan"}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium">
                      {m.role === "owner" ? "Pembuat Celengan" : "Pasangan"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF9EC] border border-amber-200 text-stone-800 uppercase">
                  {m.role === "owner" ? "Owner" : "Partner"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kategori Transaksi Kustom Celengan */}
      <div className="p-5 rounded-3xl bg-white border border-warm-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#FFF9EC] border border-amber-200 text-orange-600 shrink-0">
              <Tag className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-warm-espresso">
                Kategori Belanja Tambahan
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Bikin kategori khusus belanja berdua
              </p>
            </div>
          </div>
        </div>

        {/* Form Tambah Kategori */}
        <form onSubmit={handleAddCategory} className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-warm-border space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warm-espresso">
              Buat Kategori Baru:
            </span>
            {/* Type selector toggle */}
            <div className="flex items-center gap-1 bg-[#F7F4EE] border border-warm-border p-0.5 rounded-xl text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setCatType("expense")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  catType === "expense"
                    ? "bg-[#FF7E7E] text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setCatType("income")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  catType === "income"
                    ? "bg-emerald-600 text-white shadow-sm"
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
              className="flex-1 h-10 px-3 rounded-xl border border-warm-border bg-white text-xs text-warm-espresso placeholder-stone-400 focus:outline-none focus:border-warm-apricot"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              isLoading={isSavingCat}
              className="h-10 px-3.5 text-xs font-bold shrink-0 rounded-xl bg-[#FFA259] hover:bg-[#F97316] text-stone-900 border border-orange-300"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tambah
            </Button>
          </div>

          {catError && (
            <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{catError}</span>
            </div>
          )}

          {catSuccess && (
            <div role="status" className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{catSuccess}</span>
            </div>
          )}
        </form>

        {/* Daftar Kategori Kustom */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-warm-espresso">
            Daftar Kategori Tambahan ({customCategories.length}):
          </span>

          {customCategories.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-1">
              Belum ada kategori kustom. 12 kategori bawaan siap digunakan.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {customCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFDF9] border border-warm-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${
                        cat.type === "expense"
                          ? "bg-rose-50 border-rose-200 text-warm-coral"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      }`}
                    >
                      {cat.type === "expense" ? "Keluar" : "Masuk"}
                    </span>
                    <span className="font-bold text-warm-espresso">
                      {cat.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={deletingCatId === cat.id}
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-warm-coral hover:bg-rose-50 transition"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Integrasi Notifikasi Belanja Otomatis */}
      <div id="webhook" className="p-5 rounded-3xl bg-white border border-warm-border space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#FFF9EC] border border-amber-200 text-orange-600 shrink-0">
              <Smartphone className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-warm-espresso">
                Sambungan Notifikasi HP
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Catat otomatis saat ada notifikasi belanja di HP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowIntegration(!showIntegration)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#F7F4EE] border border-warm-border text-stone-700 hover:text-warm-espresso transition shrink-0"
          >
            {showIntegration ? "Tutup" : "Buka Panduan"}
          </button>
        </div>

        {showIntegration && (
          <div className="pt-2 space-y-4 border-t border-warm-border">
            {/* Supported Apps List */}
            <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-warm-border text-[11px] text-stone-600 space-y-1.5 shadow-2xs">
              <p className="font-bold text-warm-espresso">
                Aplikasi yang Didukung Otomatis:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {["BCA Mobile", "GoPay", "ShopeePay", "BRI (BRImo)", "BNI", "SeaBank"].map((app) => (
                  <span
                    key={app}
                    className="px-2.5 py-0.5 rounded-md bg-[#FFF9EC] border border-amber-200 text-stone-800 text-[10px] font-bold"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* Webhook Secret Key Management Box */}
            <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-warm-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-600" />
                  <span className="text-xs font-bold text-warm-espresso">
                    Kode Sambungan HP:
                  </span>
                </div>
              </div>

              {revealedKey ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-[#FFF9EC] p-2.5 rounded-xl border border-amber-200">
                    <code className="text-[11px] font-mono font-bold text-stone-900 break-all select-all">
                      {revealedKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(revealedKey, "key")}
                      className="w-8 h-8 rounded-lg text-orange-600 hover:text-orange-800 flex items-center justify-center shrink-0 ml-1"
                      title="Salin Kunci"
                    >
                      {copiedWebhookKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-stone-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                    <span>
                      Kode baru aktif sekarang. Salin dan tempel ke MacroDroid HP kalian. Kode lama otomatis tidak berlaku lagi.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-warm-border gap-2">
                  <span className="font-mono text-xs text-stone-400 tracking-wider truncate min-w-0">
                    ckp_live_••••••••
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isPendingRotate}
                    onClick={handleRotateKey}
                    className="h-8 px-2.5 text-xs text-stone-700 font-bold border-warm-border rounded-xl shrink-0 whitespace-nowrap"
                  >
                    <RefreshCw className="w-3 h-3 mr-1 shrink-0" />
                    Ganti Kode
                  </Button>
                </div>
              )}

              {rotateError && (
                <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{rotateError}</span>
                </div>
              )}

              <p className="text-[10px] text-stone-500 leading-relaxed font-medium">
                Kode ini aman dan privat. Hanya kalian berdua yang bisa menyambungkan HP ke celengan ini.
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2.5 text-xs text-stone-700">
              <p className="font-bold text-warm-espresso">Cara Menyambungkan:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-stone-600 leading-relaxed">
                <li>Download aplikasi <strong>MacroDroid</strong> di HP Android dari Google Play Store.</li>
                <li>Buat aturan baru (*Trigger*) saat menerima notifikasi dari aplikasi m-banking atau e-wallet.</li>
                <li>Atur aksi (*Action*) HTTP POST ke Alamat URL & Kode Sambungan di bawah.</li>
              </ol>

              {/* Collapsible Technical Details */}
              <details className="pt-2 group">
                <summary className="text-xs font-bold text-orange-600 cursor-pointer select-none hover:underline">
                  Lihat Alamat URL & Format Data &darr;
                </summary>
                <div className="mt-2 space-y-3 pt-2 border-t border-warm-border">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-warm-espresso">Alamat URL Webhook:</p>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-warm-border">
                      <code className="text-[11px] text-orange-700 break-all select-all font-mono">
                        {webhookUrl}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(webhookUrl, "url")}
                        className="w-8 h-8 rounded-lg text-stone-500 hover:text-stone-900 flex items-center justify-center shrink-0"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-warm-espresso">Format Isi Data (JSON):</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(samplePayload, "payload")}
                        className="text-[10px] text-orange-600 font-bold flex items-center gap-1 hover:underline"
                      >
                        {copiedPayload ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Salin Format
                      </button>
                    </div>
                    <pre className="bg-[#FBF8F2] text-stone-800 border border-warm-border p-2.5 rounded-xl text-[10px] font-mono overflow-x-auto">
                      {samplePayload}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="pt-2">
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            className="w-full min-h-[44px] rounded-xl border border-rose-200 bg-white text-warm-coral hover:bg-rose-50 font-bold text-xs shadow-2xs"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Keluar dari Akun
          </Button>
        </form>
      </div>
    </div>
  );
}
