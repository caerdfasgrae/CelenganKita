/**
 * Lightweight LLM Parser untuk Ekstraksi Entitas Struk Belanja (KIE)
 * Menggunakan Gemini 2.0 Flash REST API (Zero Heavy Dependencies)
 * Sesuai metodologi komparasi skripsi: Spatial-Keyword Anchoring vs Lightweight LLM
 */

export interface LLMParseResult {
  isAvailable: boolean;
  reason?: string;
  merchant: string | null;
  amount: number | null;
  date: string | null;
  latencyMs: number;
}

export async function parseReceiptWithLLM(rawText: string): Promise<LLMParseResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return {
      isAvailable: false,
      reason: "GEMINI_API_KEY belum dikonfigurasi di lingkungan server.",
      merchant: null,
      amount: null,
      date: null,
      latencyMs: 0,
    };
  }

  const startTime = performance.now();

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Anda adalah asisten ekstraksi informasi dokumen struk belanja (Key Information Extraction / KIE) khusus struk di Indonesia.
Berikut adalah teks mentah hasil OCR dari struk fisik (bisa memuat derau optik atau teks dari kertas di sekitarnya):

---
${rawText}
---

Tugas Anda:
1. "merchant": Nama toko / restoran / entitas usaha utama (contoh: "Warung Pasta"). Abaikan teks derau di latar belakang kertas fotokopi.
2. "total": Nominal akhir total belanja (angka bulat murni tanpa titik/koma). HATI-HATI: Jangan keliru dengan nomor telepon (seperti P.7193776), nomor faks, nomor meja (Table #), nomor faktur, atau nomor NPWP.
3. "date": Waktu/tanggal transaksi jika ada, atau null jika tidak ada.

Kembalikan HANYA format JSON valid tanpa blok markdown dan tanpa penjelasan tambahan, dengan skema:
{"merchant": "string", "total": 0, "date": "string or null"}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      console.warn("Gemini API call failed with status:", response.status);
      return {
        isAvailable: false,
        reason: `Gemini API returned error status ${response.status}`,
        merchant: null,
        amount: null,
        date: null,
        latencyMs,
      };
    }

    const resJson = await response.json();
    const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return {
        isAvailable: false,
        reason: "Gemini API returned empty candidate response.",
        merchant: null,
        amount: null,
        date: null,
        latencyMs,
      };
    }

    // Bersihkan karakter markdown jika ada
    const cleanJsonText = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJsonText);

    return {
      isAvailable: true,
      merchant: typeof parsed.merchant === "string" ? parsed.merchant.trim() : null,
      amount: typeof parsed.total === "number" && parsed.total > 0 ? parsed.total : null,
      date: typeof parsed.date === "string" ? parsed.date.trim() : null,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    console.error("Error in parseReceiptWithLLM:", err);
    return {
      isAvailable: false,
      reason: err?.message || "Terjadi kesalahan saat memanggil LLM parser.",
      merchant: null,
      amount: null,
      date: null,
      latencyMs,
    };
  }
}
