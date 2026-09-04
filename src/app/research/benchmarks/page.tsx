import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, Download, Database, Zap, Cpu, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import BenchmarksTable from "./benchmarks-table";
import { ReceiptEvaluation } from "@/types/database";

export default async function ResearchBenchmarksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil Space aktif pengguna
  const { data: memberRecord } = await supabase
    .from("space_members")
    .select("space_id, spaces(name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    redirect("/space/setup");
  }

  const spaceId = memberRecord.space_id;
  const spaceName = (memberRecord.spaces as any)?.name || "Celengan";

  // Ambil data evaluasi riset
  let evaluations: ReceiptEvaluation[] = [];
  let tableMissing = false;

  const { data, error } = await supabase
    .from("receipt_evaluations")
    .select("*")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || error.message.includes("does not exist")) {
      tableMissing = true;
    } else {
      console.error("Error fetching evaluations:", error);
    }
  } else {
    evaluations = (data || []) as ReceiptEvaluation[];
  }

  // Hitung Metrik Evaluasi Komparatif
  const total = evaluations.length;
  let spatialAmountMatches = 0;
  let llmAmountMatches = 0;
  let totalSpatialLatency = 0;
  let totalLLMLatency = 0;
  let llmSuccessCount = 0;

  evaluations.forEach((item) => {
    if (Number(item.spatial_amount) === Number(item.actual_amount)) {
      spatialAmountMatches++;
    }
    if (item.llm_amount !== null && Number(item.llm_amount) === Number(item.actual_amount)) {
      llmAmountMatches++;
    }
    totalSpatialLatency += item.spatial_latency_ms || 0;
    if (item.llm_latency_ms > 0) {
      totalLLMLatency += item.llm_latency_ms;
      llmSuccessCount++;
    }
  });

  const spatialAccuracy = total > 0 ? Math.round((spatialAmountMatches / total) * 100) : 0;
  const llmAccuracy = total > 0 ? Math.round((llmAmountMatches / total) * 100) : 0;
  const avgSpatialLatency = total > 0 ? Math.round(totalSpatialLatency / total) : 0;
  const avgLLMLatency = llmSuccessCount > 0 ? Math.round(totalLLMLatency / llmSuccessCount) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Data Riset Skripsi
              </span>
              <span className="text-xs text-slate-500">Space: {spaceName}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Benchmark KIE: Spatial-Keyword vs Lightweight LLM
            </h1>
          </div>
        </div>
      </div>

      {tableMissing && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <p className="font-bold">
            Tabel `receipt_evaluations` belum terpasang di database Supabase Anda.
          </p>
          <p>
            Silakan buka <strong>Supabase Dashboard &gt; SQL Editor</strong>, lalu jalankan file migrasi{" "}
            <code>supabase/migrations/20260904020000_receipt_evaluations.sql</code> atau salin dari{" "}
            <code>supabase/schema.sql</code>.
          </p>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Sampel Struk</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{total}</p>
          <p className="text-[10px] text-slate-500">Ground truth tersimpan</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Akurasi Spatial (EMR)</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {spatialAccuracy}%
          </p>
          <p className="text-[10px] text-slate-500">
            {spatialAmountMatches}/{total} nominal tepat
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Akurasi LLM (EMR)</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{llmAccuracy}%</p>
          <p className="text-[10px] text-slate-500">
            {llmAmountMatches}/{total} nominal tepat
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Perbandingan Latensi</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs font-black text-slate-800 dark:text-slate-200 pt-1">
            Spatial: <span className="text-emerald-600 font-mono">{avgSpatialLatency}ms</span>
          </p>
          <p className="text-xs font-black text-slate-800 dark:text-slate-200">
            LLM: <span className="text-purple-600 font-mono">{avgLLMLatency}ms</span>
          </p>
        </div>
      </div>

      {/* Benchmarks Table with Export CSV Feature */}
      <BenchmarksTable evaluations={evaluations} />
    </div>
  );
}
