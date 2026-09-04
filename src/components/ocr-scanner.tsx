"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cleanCurrencyString } from "@/lib/utils";

interface OCRScannerProps {
  onDetected: (amount: number, merchantSuggestion: string | null, rawText: string) => void;
  onCancel?: () => void;
}

export default function OCRScanner({ onDetected, onCancel }: OCRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pre-processing gambar di HTML5 Canvas: Grayscale + Binarization/Contrast Boost
  function preprocessImage(imageElement: HTMLImageElement): string {
    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageElement.src;

    // Batasi resolusi maksimal agar Tesseract tidak lambat di HP
    const maxDim = 1500;
    let width = imageElement.naturalWidth || imageElement.width;
    let height = imageElement.naturalHeight || imageElement.height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Gambar ke canvas
    ctx.drawImage(imageElement, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    // Konversi ke Grayscale dan tingkatkan kontras untuk teks struk
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrasted = gray > 140 ? Math.min(255, gray * 1.2) : Math.max(0, gray * 0.8);

      d[i] = contrasted;
      d[i + 1] = contrasted;
      d[i + 2] = contrasted;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  // Parse Teks Struk untuk mencari total nominal & nama toko/merchant
  function extractReceiptData(text: string): { amount: number; merchant: string | null } {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let detectedAmount = 0;
    let detectedMerchant: string | null = null;

    // 1. Merchant biasanya ada di 1-3 baris teratas struk
    for (let i = 0; i < Math.min(4, lines.length); i++) {
      const line = lines[i];
      if (!/struk|nota|selamat datang|kasir|tanggal|no\.|transaksi/i.test(line) && line.length > 3) {
        detectedMerchant = line;
        break;
      }
    }

    // 2. Cari baris "TOTAL", "TOTAL BELANJA", "TAGIHAN", "GRAND TOTAL", atau "NETTO"
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (/total|grand total|bayar|netto|tagihan|jumlah/i.test(line) && !/kembali|diskon|item|qty/i.test(line)) {
        const match = line.match(/(?:rp|idr)?\s*([0-9.,]{3,})/i);
        if (match && match[1]) {
          const val = cleanCurrencyString(match[1]);
          if (val > 0) {
            detectedAmount = val;
            break;
          }
        }
      }
    }

    // 3. Jika belum ketemu dari kata "TOTAL", cari angka nominal terbesar yang wajar di struk
    if (detectedAmount === 0) {
      let maxCandidate = 0;
      for (const line of lines) {
        if (/kembalian|uang tunai|cash|change/i.test(line)) continue;
        const matches = line.matchAll(/(?:rp|idr)?\s*([0-9.,]{3,})/gi);
        for (const m of matches) {
          const val = cleanCurrencyString(m[1]);
          if (val > 1000 && val < 50000000 && val > maxCandidate) {
            maxCandidate = val;
          }
        }
      }
      detectedAmount = maxCandidate;
    }

    return { amount: detectedAmount, merchant: detectedMerchant };
  }

  async function processImageFile(file: File) {
    setError(null);
    setIsProcessing(true);
    setProgressStatus("Menyiapkan gambar...");
    setProgressPercent(10);

    try {
      // Baca file sebagai Data URL
      const reader = new FileReader();
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPreviewImage(rawDataUrl);

      // Muat gambar ke Image element untuk preprocessing
      const img = new Image();
      img.src = rawDataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      setProgressStatus("Meningkatkan kontras teks...");
      setProgressPercent(25);
      const preprocessedUrl = preprocessImage(img);

      setProgressStatus("Memuat modul OCR...");
      setProgressPercent(40);

      // Dynamic import tesseract.js: Hanya dimuat saat pemrosesan gambar berlangsung (Performance / Bundle Optimization)
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("ind+eng", undefined, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgressStatus("Membaca teks struk...");
            setProgressPercent(50 + Math.round(m.progress * 45));
          }
        },
      });

      const { data } = await worker.recognize(preprocessedUrl);
      await worker.terminate();

      setProgressStatus("Mengekstrak data finansial...");
      setProgressPercent(100);

      const { amount, merchant } = extractReceiptData(data.text);

      if (amount <= 0) {
        setError("Teks terbaca, namun total nominal tidak terdeteksi jelas. Silakan periksa atau masukkan nominal manual.");
      }

      onDetected(amount, merchant, data.text);
    } catch (err: any) {
      console.error("OCR Error:", err);
      setError("Gagal memproses gambar: " + (err.message || "Error OCR"));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  }

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
      {/* Hidden input file untuk Kamera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hidden input file untuk Galeri */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Scan Struk / Screenshot (OCR)
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Diproses 100% di browser HP kamu (Hemat Server)
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            Tutup
          </button>
        )}
      </div>

      {/* Image Preview & Scanner Visual */}
      {previewImage ? (
        <div className="relative rounded-lg overflow-hidden aspect-[4/3] bg-black/5 flex items-center justify-center border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Preview Struk"
            className="w-full h-full object-contain"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs font-semibold">{progressStatus}</p>
              <div className="w-40 bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-center p-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Pilih Sumber Foto Struk / Bukti Transfer
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Bisa ambil foto baru atau unggah screenshot dari galeri
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons: Kamera vs Galeri (Touch targets >= 44px) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => cameraInputRef.current?.click()}
          className="min-h-[44px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Ambil Kamera
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[44px] px-3 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          Pilih Galeri
        </button>
      </div>
    </div>
  );
}
