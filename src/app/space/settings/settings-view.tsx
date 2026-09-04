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
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import { rotateWebhookKey } from "@/app/space/actions";
import { Space, SpaceMember } from "@/types/database";
import { Button } from "@/components/ui/button";

interface SettingsViewProps {
  space: Space;
  members: SpaceMember[];
  siteUrl: string;
}

export default function SettingsView({ space, members, siteUrl }: SettingsViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedWebhookKey, setCopiedWebhookKey] = useState(false);

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

  function shareInviteCode() {
    const shareText = `Halo sayang! Yuk gabung ke Ruang Anggaran bersama kita di CelenganKita. Buka ${siteUrl} lalu masukkan Kode Undangan: ${space.invite_code}`;
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
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ruang Anggaran
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {space.name}
            </h2>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Users className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
              Kode Undangan Pasangan:
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              8 Karakter
            </span>
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <span className="font-mono text-base font-black tracking-widest text-emerald-700 dark:text-emerald-300">
              {space.invite_code}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyToClipboard(space.invite_code, "code")}
                className="w-9 h-9 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition flex items-center justify-center"
                title="Salin Kode"
                aria-label="Salin kode undangan"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={shareInviteCode}
                className="h-9 px-3 text-xs"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Undang
              </Button>
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-500">Anggota Terdaftar:</span>
          <div className="space-y-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {m.nickname || m.profile?.full_name || "Pasangan"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panduan Setup Webhook MacroDroid (Fitur 1) */}
      <div id="webhook" className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400">
            <Smartphone className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Setup Otomatisasi HP (MacroDroid / Tasker)
            </h3>
            <p className="text-[10px] text-slate-500">
              Sinkronisasi notifikasi m-banking & e-wallet secara aman
            </p>
          </div>
        </div>

        {/* Webhook Secret Key Management Box */}
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Kunci Rahasia Webhook (Secret Key):
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">X-Celengan-Key</span>
          </div>

          {revealedKey ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-300 dark:border-emerald-700">
                <code className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 break-all select-all">
                  {revealedKey}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(revealedKey, "key")}
                  className="w-8 h-8 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 flex items-center justify-center shrink-0 ml-1"
                  title="Salin Kunci"
                >
                  {copiedWebhookKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Kunci baru aktif seketika. Salin dan tempel ke MacroDroid sekarang. Kunci lama langsung tidak berlaku lagi (instant invalidation).
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-xs text-slate-400 tracking-wider">
                ckp_live_••••••••••••••••••••••••
              </span>
              <Button
                variant="outline"
                size="sm"
                isLoading={isPendingRotate}
                onClick={handleRotateKey}
                className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-300"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Rotasi Kunci
              </Button>
            </div>
          )}

          {rotateError && (
            <div role="alert" className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{rotateError}</span>
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-relaxed">
            Kunci ini rahasia. Server tidak menyimpan plaintext token ini. Jika Anda kehilangan kunci atau ingin mengganti, tekan <strong>Rotasi Kunci</strong>.
          </p>
        </div>

        {/* Supported Apps List */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            Aplikasi yang Didukung Otomatis:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {["BCA Mobile", "GoPay", "ShopeePay", "BRI (BRImo)", "BNI", "SeaBank"].map((app) => (
              <span
                key={app}
                className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
              >
                {app}
              </span>
            ))}
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">1. Webhook Endpoint URL</p>
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <code className="text-[11px] text-emerald-600 dark:text-emerald-400 break-all select-all font-mono">
                {webhookUrl}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, "url")}
                className="w-8 h-8 rounded-lg text-slate-500 hover:text-emerald-600 flex items-center justify-center shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">2. Cara Setting di MacroDroid (Android Gratis)</p>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li>Buka MacroDroid &rarr; Tambah Makro Baru.</li>
              <li>
                <strong>Trigger</strong>: Pilih <em>Device Events &rarr; Notification &rarr; Notification Received</em> &rarr; Pilih aplikasi target (BCA / GoPay / ShopeePay / BRI / BNI / SeaBank).
              </li>
              <li>
                <strong>Action</strong>: Pilih <em>Connectivity &rarr; HTTP Request</em>:
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  <li>Method: <code>POST</code></li>
                  <li>URL: Masukkan Endpoint URL di atas</li>
                  <li>
                    Header: Tambahkan <code>X-Celengan-Key: &lt;Kunci Webhook di atas&gt;</code>
                  </li>
                  <li>Content Type: <code>application/json</code></li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 dark:text-white">3. Format JSON Body MacroDroid</p>
              <button
                type="button"
                onClick={() => copyToClipboard(samplePayload, "payload")}
                className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:underline"
              >
                {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Salin JSON
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
              {samplePayload}
            </pre>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="pt-2">
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            className="w-full min-h-[44px] border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Keluar dari Akun
          </Button>
        </form>
      </div>
    </div>
  );
}
