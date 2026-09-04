"use client";

import { useState } from "react";
import { Download, CheckCircle2, XCircle, Search, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptEvaluation } from "@/types/database";
import { formatRupiah } from "@/lib/utils";

interface BenchmarksTableProps {
  evaluations: ReceiptEvaluation[];
}

export default function BenchmarksTable({ evaluations }: BenchmarksTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function exportToCSV() {
    if (evaluations.length === 0) return;

    const headers = [
      "ID",
      "Tanggal",
      "Actual Merchant (Ground Truth)",
      "Actual Amount (Ground Truth)",
      "Spatial Merchant",
      "Spatial Amount",
      "Spatial Amount Match",
      "Spatial Latency (ms)",
      "LLM Merchant",
      "LLM Amount",
      "LLM Amount Match",
      "LLM Latency (ms)",
      "LLM Status",
      "Raw Text",
    ];

    const rows = evaluations.map((item) => {
      const spatialMatch = Number(item.spatial_amount) === Number(item.actual_amount) ? "1" : "0";
      const llmMatch = item.llm_amount !== null && Number(item.llm_amount) === Number(item.actual_amount) ? "1" : "0";

      return [
        `"${item.id}"`,
        `"${item.created_at}"`,
        `"${(item.actual_merchant || "").replace(/"/g, '""')}"`,
        item.actual_amount,
        `"${(item.spatial_merchant || "").replace(/"/g, '""')}"`,
        item.spatial_amount || 0,
        spatialMatch,
        item.spatial_latency_ms || 0,
        `"${(item.llm_merchant || "").replace(/"/g, '""')}"`,
        item.llm_amount || 0,
        llmMatch,
        item.llm_latency_ms || 0,
        `"${item.llm_status}"`,
        `"${(item.raw_text || "").replace(/\n/g, " ").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `celengankita_kie_benchmark_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filtered = evaluations.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.actual_merchant && item.actual_merchant.toLowerCase().includes(term)) ||
      (item.spatial_merchant && item.spatial_merchant.toLowerCase().includes(term)) ||
      (item.llm_merchant && item.llm_merchant.toLowerCase().includes(term)) ||
      item.actual_amount.toString().includes(term)
    );
  });

  return (
    <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Tabel Evaluasi Komparatif Ground Truth
          </h2>
          <p className="text-[11px] text-slate-500">
            Perbandingan akurasi entitas tebakan sistem dengan koreksi aktual pengguna
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari merchant atau nominal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={exportToCSV}
            disabled={evaluations.length === 0}
            className="h-9 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Dataset (.CSV)
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-1 text-xs">
          <FileText className="w-8 h-8 mx-auto stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="font-bold">Belum ada data evaluasi struk.</p>
          <p className="text-[11px]">
            Setiap kali Anda memotret struk di menu Catat Transaksi, sistem akan otomatis mencatat data evaluasi ke sini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                <th className="py-3 px-2">Tanggal</th>
                <th className="py-3 px-3">Ground Truth (Aktual)</th>
                <th className="py-3 px-3">Spatial-Keyword</th>
                <th className="py-3 px-3">Lightweight LLM</th>
                <th className="py-3 px-2">Raw Text</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filtered.map((item) => {
                const isSpatialAmountCorrect = Number(item.spatial_amount) === Number(item.actual_amount);
                const isLLMAmountCorrect =
                  item.llm_amount !== null && Number(item.llm_amount) === Number(item.actual_amount);
                const isExpanded = expandedId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2 text-[10px] text-slate-500">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{item.actual_merchant}</p>
                      <p className="font-mono font-black text-slate-900 dark:text-white">
                        {formatRupiah(item.actual_amount)}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-sans">
                        {isSpatialAmountCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300">
                            {item.spatial_merchant || "-"}
                          </p>
                          <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {item.spatial_amount ? formatRupiah(item.spatial_amount) : "-"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">{item.spatial_latency_ms}ms</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-sans">
                        {item.llm_status !== "success" ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-sans">
                            {item.llm_status}
                          </span>
                        ) : isLLMAmountCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300">
                            {item.llm_merchant || "-"}
                          </p>
                          <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {item.llm_amount ? formatRupiah(item.llm_amount) : "-"}
                          </p>
                        </div>
                      </div>
                      {item.llm_latency_ms > 0 && (
                        <span className="text-[9px] text-slate-400 font-mono">{item.llm_latency_ms}ms</span>
                      )}
                    </td>

                    <td className="py-3 px-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Tampilkan Teks OCR Mentah"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 p-2 bg-slate-950 text-slate-200 rounded-lg text-[10px] font-mono whitespace-pre-wrap max-w-xs overflow-x-auto max-h-40 overflow-y-auto">
                          {item.raw_text}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
