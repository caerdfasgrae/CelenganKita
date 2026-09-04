"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cleanCurrencyString } from "@/lib/utils";

interface OCRScannerProps {
  onDetected: (
    amount: number,
    merchantSuggestion: string | null,
    rawText: string,
    telemetry?: {
      spatialAmount: number;
      spatialMerchant: string | null;
      spatialLatencyMs: number;
    },
    suggestedCategory?: string | null,
    detectedDate?: string | null
  ) => void;
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

  // Pre-processing gambar di HTML5 Canvas: Dynamic Scaling + Contrast Stretching (Min-Max Normalization)
  function preprocessImage(imageElement: HTMLImageElement): string {
    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageElement.src;

    let width = imageElement.naturalWidth || imageElement.width;
    let height = imageElement.naturalHeight || imageElement.height;

    // Optimasi resolusi untuk Tesseract (tinggi karakter ideal ~25-35px):
    // 1. Jika gambar terlalu kecil (< 900px seperti struk resolusi rendah), naikkan skala agar titik dot-matrix terbaca.
    // 2. Jika gambar kamera ponsel sangat besar (> 1800px), perkecil ke 1800px agar hemat memori HP.
    if (width < 900 && height < 900) {
      const scale = Math.min(2.5, 1200 / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    } else if (width > 1800 || height > 1800) {
      const maxDim = 1800;
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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imageElement, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    // Hitung grayscale dan cari batas min/max luminansi
    let minG = 255;
    let maxG = 0;
    const grays = new Uint8ClampedArray(d.length / 4);

    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      grays[j] = gray;
      if (gray < minG) minG = gray;
      if (gray > maxG) maxG = gray;
    }

    // Min-Max Contrast Stretching (menjaga tinta dot-matrix ungu/biru tetap utuh)
    const range = maxG - minG || 1;
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const g = grays[j];
      const stretched = Math.round(((g - minG) / range) * 255);
      d[i] = stretched;
      d[i + 1] = stretched;
      d[i + 2] = stretched;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  // Ekstraksi Tanggal & Waktu Struk (Standar ISO YYYY-MM-DDTHH:mm untuk input datetime-local)
  function extractReceiptDate(text: string): string | null {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    function normalizeDateNoise(str: string) {
      return str
        .replace(/(\d)[oO](\d)/g, "$10$2")
        .replace(/(\d)[lI](\d)/g, "$11$2")
        .replace(/([lI])(\d)/g, "1$2")
        .replace(/(\d)([lI])/g, "$11");
    }

    const dateWithTimeRegex =
      /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b(?:\s+(?:jam\s*)?(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?/i;

    const dayDateRegex =
      /(?:senin|selasa|rabu|kamis|jumat|sabtu|minggu|mon|tue|wed|thu|fri|sat|sun)[a-z]*[,\s]+([0-9lIos\-_/.]{6,12})(?:\s+([0-9:.]+))?/i;

    const monthNameMap: Record<string, string> = {
      jan: "01", januari: "01", january: "01",
      feb: "02", februari: "02", february: "02",
      mar: "03", maret: "03", march: "03",
      apr: "04", april: "04",
      mei: "05", may: "05",
      jun: "06", juni: "06", june: "06",
      jul: "07", juli: "07", july: "07",
      agu: "08", agustus: "08", aug: "08", august: "08",
      sep: "09", september: "09",
      okt: "10", oktober: "10", oct: "10", october: "10",
      nop: "11", november: "11", nov: "11",
      des: "12", desember: "12", dec: "12", december: "12",
    };
    const namedMonthRegex =
      /\b(\d{1,2})\s+([a-zA-Z]{3,9})\s+(\d{2,4})(?:\s+(\d{1,2})[:.](\d{2}))?/i;

    for (const rawLine of lines) {
      if (/(?:p|f|telp|phone|fax)\s*[:.]?\s*[0-9]+/i.test(rawLine) || /npwp/i.test(rawLine)) {
        continue;
      }

      // A. Format bulan bernama (misal: "16 Nov 2023 14:30")
      const namedMatch = rawLine.match(namedMonthRegex);
      if (namedMatch) {
        const day = namedMatch[1].padStart(2, "0");
        const monthStr = namedMatch[2].toLowerCase();
        const yearRaw = namedMatch[3];
        const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
        const month = monthNameMap[monthStr];
        if (month) {
          const hour = namedMatch[4] ? namedMatch[4].padStart(2, "0") : "12";
          const minute = namedMatch[5] ? namedMatch[5].padStart(2, "0") : "00";
          return `${year}-${month}-${day}T${hour}:${minute}`;
        }
      }

      // B. Format Hari + Tanggal (misal: "Monday 16-11-15 16:04:52")
      const dayMatch = rawLine.match(dayDateRegex);
      if (dayMatch) {
        const rawDatePart = dayMatch[1].replace(/[lI]/g, "1").replace(/[oO]/g, "0").replace(/[sS]/g, "5");
        const dateParts = rawDatePart.split(/[-/._]/).map((p) => p.trim()).filter(Boolean);
        if (dateParts.length === 3) {
          let [d, m, y] = dateParts;
          if (y.length === 2) y = `20${y}`;
          if (d.length <= 2 && m.length <= 2) {
            const day = d.padStart(2, "0");
            const month = m.padStart(2, "0");
            let hour = "12";
            let minute = "00";
            if (dayMatch[2]) {
              const timePart = dayMatch[2].replace(/[oO]/g, "0").replace(/[lI]/g, "1");
              const timeTokens = timePart.split(/[:.]/).map((t) => t.trim());
              if (timeTokens[0]) hour = timeTokens[0].padStart(2, "0");
              if (timeTokens[1]) minute = timeTokens[1].padStart(2, "0");
            }
            return `${y}-${month}-${day}T${hour}:${minute}`;
          }
        }
      }

      // C. Format Numerik Standar (DD-MM-YYYY atau YYYY-MM-DD)
      const cleanLine = normalizeDateNoise(rawLine);
      const numMatch = cleanLine.match(dateWithTimeRegex);
      if (numMatch) {
        const [_, p1, p2, p3, rawHour, rawMinute] = numMatch;
        let year = "";
        let month = "";
        let day = "";
        if (p1.length === 4) {
          year = p1;
          month = p2.padStart(2, "0");
          day = p3.padStart(2, "0");
        } else {
          year = p3.length === 2 ? `20${p3}` : p3;
          day = p1.padStart(2, "0");
          month = p2.padStart(2, "0");
        }

        const numMonth = parseInt(month, 10);
        const numDay = parseInt(day, 10);
        const numYear = parseInt(year, 10);

        if (numMonth >= 1 && numMonth <= 12 && numDay >= 1 && numDay <= 31 && numYear >= 2000 && numYear <= 2040) {
          const hour = rawHour ? rawHour.padStart(2, "0") : "12";
          const minute = rawMinute ? rawMinute.padStart(2, "0") : "00";
          return `${year}-${month}-${day}T${hour}:${minute}`;
        }
      }
    }

    return null;
  }

  // Klasifikasi Cerdas Kategori Transaksi dari Merchant & Teks Struk
  function classifyCategory(merchant: string | null, text: string): string | null {
    const combined = `${merchant || ""} ${text || ""}`.toLowerCase();

    const categoryRules = [
      {
        name: "Makanan & Minuman",
        patterns: [
          /\b(?:warung|cafe|resto|restoran|kopi|coffee|bakso|kitchen|pasta|mie|ayam|sate|soto|beverage|food|teh|tea|bistro|diner|makan|minum|pizza|burger|snack|roti|bakery|cake|donat|gelato|ice\s*cream|dimsum|steak|sushi|kuliner|kedai)\b/i,
        ],
        weight: 10,
      },
      {
        name: "Belanja Bulanan & Dapur",
        patterns: [
          /\b(?:indomaret|alfamart|alfamidi|superindo|hypermart|transmart|lotte|hero|ranch\s*market|farmer|minimarket|supermarket|sembako|pasar|sayur|buah|dapur|deterjen|minyak|beras|gula|telur|sabun|shampoo)\b/i,
        ],
        weight: 10,
      },
      {
        name: "Transportasi",
        patterns: [
          /\b(?:spbu|pertamina|shell|bp|bensin|pertalite|pertamax|solar|parkir|parking|tol|tarik\s*tol|etoll|e-toll|grab|gojek|maxim|ojol|kai|kereta|krl|mrt|lrt|transjakarta|tiket|penerbangan|garuda|lion|citilink)\b/i,
        ],
        weight: 10,
      },
      {
        name: "Kesehatan & Obat",
        patterns: [
          /\b(?:apotek|apotik|kimia\s*farma|k24|k-24|guardian|watsons|century|klinik|clinic|dokter|doctor|rumah\s*sakit|hospital|obat|paracetamol|vitamin|resep|medika|lab|laboratorium|prodia)\b/i,
        ],
        weight: 10,
      },
      {
        name: "Tagihan & Utilitas",
        patterns: [
          /\b(?:pln|listrik|token\s*listrik|pdam|air|indihome|myrepublic|biznet|telkom|telkomsel|indosat|xl|tri|smartfren|pulsa|paket\s*data|bpjs|pbb|iuran|wifi)\b/i,
        ],
        weight: 10,
      },
      {
        name: "Hiburan & Kencan",
        patterns: [
          /\b(?:cinema|cinepolis|xxi|21|bioskop|cgv|timezone|funworld|karaoke|billiard|netflix|spotify|disney|youtube|game|steam|playstation|rekreasi|wisata|dufan|ancol|zoo|taman)\b/i,
        ],
        weight: 10,
      },
      {
        name: "Pendidikan & Buku",
        patterns: [
          /\b(?:gramedia|gunung\s*agung|buku|bookstore|atk|alat\s*tulis|fotokopi|fotocopy|kursus|les|udemy|coursera|spp|uang\s*kuliah|universitas|sekolah|kampus|seminar)\b/i,
        ],
        weight: 10,
      },
      {
        name: "Fashion & Pakaian",
        patterns: [
          /\b(?:uniqlo|zara|h&m|matahari|ramayana|baju|celana|kaos|sepatu|tas|jaket|optik|seis|melawai|kacamata|distro|boutique)\b/i,
        ],
        weight: 8,
      },
    ];

    let bestCategory: string | null = null;
    let maxScore = 0;

    for (const rule of categoryRules) {
      let score = 0;
      for (const pat of rule.patterns) {
        if (pat.test(combined)) {
          score += rule.weight;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestCategory = rule.name;
      }
    }

    return bestCategory;
  }

  // Parse Teks Struk menggunakan Metode Spatial-Keyword Anchoring berlandaskan teori Document Layout Analysis (DLA)
  function extractReceiptData(text: string): {
    amount: number;
    merchant: string | null;
    suggestedCategory: string | null;
    detectedDate: string | null;
    latencyMs: number;
  } {
    const startTime = performance.now();
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 1. Negative Context Filters (Teori: False Positive Rejection)
    const isContactLine = (l: string) =>
      /(?:^|[\s,;])(?:p|f|telp|tlp|phone|fax|wa|call)\s*[:.]?\s*[0-9]+/i.test(l);

    const isTaxIdLine = (l: string) => /npwp|nppkp/i.test(l);

    const isMetadataLine = (l: string) =>
      /^(?:table|meja|guest|kasir|cashier|pos|reg)\s*[:#]?\s*[0-9]+$/i.test(l);

    // 2. Ekstraksi Nama Toko / Merchant Cerdas (Header Zone ~35% teratas)
    let detectedMerchant: string | null = null;
    const merchantBlacklist =
      /struk|nota|selamat datang|kasir|tanggal|transaksi|table|guest|order|bill|receipt|pembayaran|terima kasih|thank you/i;

    let bestScore = -1;
    const headerBoundary = Math.min(8, lines.length);

    for (let i = 0; i < headerBoundary; i++) {
      const rawLine = lines[i];
      if (isContactLine(rawLine) || isTaxIdLine(rawLine) || isMetadataLine(rawLine)) continue;
      if (merchantBlacklist.test(rawLine)) continue;

      const cleaned = rawLine.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "").trim();
      if (cleaned.length < 3) continue;

      if (/\b(?:jl|jalan|raya|kemang raya|no\.|rt|rw|kelurahan|kecamatan|jakarta|selatan|barat|timur|utara|pusat|lantai|gedung)\b/i.test(cleaned)) {
        continue;
      }

      const words = cleaned.split(/\s+/);
      const validWords = words.filter((w) => w.length >= 2 && /^[a-zA-Z]+$/.test(w));
      const letterCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
      const symbolCount = (cleaned.match(/[^a-zA-Z0-9\s]/g) || []).length;
      if (letterCount < 3 || symbolCount > letterCount) continue;

      let score = validWords.length * 2 + (letterCount > 5 ? 3 : 0);
      if (/warung|cafe|resto|kopi|mart|pasta|bakso|kitchen|market|toko|shop/i.test(cleaned)) {
        score += 15;
      }
      score -= i * 0.8;

      if (score > bestScore) {
        bestScore = score;
        const matchedEntity = cleaned.match(/(?:warung|cafe|resto|kopi|mart|pasta|bakso|kitchen|market|toko|shop)\s+[a-zA-Z0-9]+/i);
        if (matchedEntity) {
          detectedMerchant = matchedEntity[0];
        } else {
          detectedMerchant = cleaned.replace(/\b[0-9]{1,3}\b/g, "").replace(/\s+/g, " ").trim();
        }
      }
    }

    // 3. Ekstraksi Finansial: Pemisahan Leksikal Formal Subtotal, Pajak, Service, dan Grand Total
    let subtotalAmount: number | null = null;
    let taxAmount: number | null = null;
    let taxPercentage: number | null = null;
    let serviceAmount: number | null = null;
    let servicePercentage: number | null = null;
    const totalLineCandidates: number[] = [];
    const lineItemAmounts: number[] = [];

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];

      if (isContactLine(line) || isTaxIdLine(line)) continue;

      // Pemisahan Leksikal Berdasarkan Anatomi Struk Finansial
      const isSubtotalLine = /sub\s*total|subtotal|s\s*total/i.test(line);
      const isServiceLine =
        !isSubtotalLine && /(?:serv|sary|seru|service|layanan)/i.test(line) && !/total/i.test(line);
      const isTaxLine =
        !isSubtotalLine && /(?:pb\s*1|pb1|pbjt|pajak|tax|ppn)/i.test(line) && !/total/i.test(line);
      const isTotalLine =
        !isSubtotalLine &&
        /(?:\bgrand\s*)?(?:tot[ao]l|otal|tota|totl|tagihan|jumlah\s*bayar|netto)\b/i.test(line) &&
        !/kembali|change|diskon|discount|item|qty|pcs/i.test(line);

      // Deteksi persentase jika ada (misal: "Serv 5%", "PB 1 10%", "PPN 11%")
      const pctMatch = line.match(/(\d{1,2})\s*[%x]/i);
      if (pctMatch) {
        const pct = parseInt(pctMatch[1], 10);
        if (isServiceLine && !servicePercentage) servicePercentage = pct;
        if (isTaxLine && !taxPercentage) taxPercentage = pct;
      } else if (isTaxLine && /pb\s*1|pb1/i.test(line)) {
        // Standar PB1 Restoran di Indonesia seragam 10%
        if (!taxPercentage) taxPercentage = 10;
      }

      // Normalisasi karakter dot matrix: huruf 'B' terbaca untuk digit '8' (misal: "B.400" -> "8.400", "B0.000" -> "80.000")
      const normalizedLine = line
        .replace(/([0-9.,])([bB])([0-9])/g, "$18$3")
        .replace(/(\s|^)([bB])([.,][0-9]{3})/g, "$18$3");

      const matches = [
        ...normalizedLine.matchAll(/(?:rp|idr)?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,})/gi),
      ];

      for (const m of matches) {
        const val = cleanCurrencyString(m[1]);
        if (val >= 1000 && val <= 100_000_000) {
          if (isTotalLine) {
            totalLineCandidates.push(val);
          } else if (isSubtotalLine && subtotalAmount === null) {
            subtotalAmount = val;
          } else if (isServiceLine && serviceAmount === null) {
            serviceAmount = val;
          } else if (isTaxLine && taxAmount === null) {
            taxAmount = val;
          } else {
            lineItemAmounts.push(val);
          }
        }
      }
    }

    // Pemulihan Subtotal dari Line Items atau Service Charge jika baris subtotal rusak
    if (!subtotalAmount && serviceAmount) {
      const sPct = servicePercentage || 5;
      const impliedSub = Math.round(serviceAmount / (sPct / 100));
      if (impliedSub >= 1000) {
        subtotalAmount = impliedSub;
      }
    }

    // Rekonstruksi Pajak Daerah PB1 (UU HKPD No. 1/2022: DPP PB1 Restoran = Subtotal + Service)
    const hasTaxKeyword = /pb\s*1|pb1|pbjt|pajak|ppn/i.test(text);
    if (subtotalAmount && (taxPercentage || hasTaxKeyword)) {
      const tPct = taxPercentage || 10;
      const taxBase = subtotalAmount + (serviceAmount || 0);
      const computedTax = Math.round(taxBase * (tPct / 100));

      // Jika taxAmount belum terbaca atau salah baca karena dot-matrix pudar, pulihkan dengan computedTax
      if (!taxAmount || Math.abs(taxAmount - computedTax) > 500) {
        taxAmount = computedTax;
      }
    }

    // 4. Teorema Rekonsiliasi Aritmetika Mandiri (Self-Consistency Verification)
    // Sesuai Bab 3.4.5 & Bab 5.3.2 Taksonomi: GrandTotal = Subtotal + Pajak + Service
    let finalAmount = 0;

    // Skenario 1: Jika terdapat subtotal dan komponen pajak/layanan (misal Warung Pasta / Resto)
    if (subtotalAmount && (taxAmount || serviceAmount)) {
      const computedTotal = subtotalAmount + (taxAmount || 0) + (serviceAmount || 0);

      // Cari apakah ada kandidat Total yang cocok persis dengan computedTotal
      const exactMatch = totalLineCandidates.find((c) => c === computedTotal);
      if (exactMatch) {
        finalAmount = exactMatch;
      } else {
        // Cek kecocokan modulo/akhiran digit jika angka paling depan memudar pada kertas dot-matrix (misal "2.400" alih-alih "92.400")
        const suffixMatch = totalLineCandidates.find(
          (c) => computedTotal % 10000 === c || computedTotal % 100000 === c
        );
        if (suffixMatch) {
          finalAmount = computedTotal;
        } else {
          finalAmount = computedTotal;
        }
      }
    } else if (totalLineCandidates.length > 0) {
      // Skenario 2: Baris Total terdeteksi langsung (ritel seperti Indomaret/Alfamart)
      const bestTotal = Math.max(...totalLineCandidates);
      if (subtotalAmount && bestTotal < subtotalAmount) {
        finalAmount = subtotalAmount;
      } else {
        finalAmount = bestTotal;
      }
    } else if (subtotalAmount) {
      // Skenario 3: Hanya baris Subtotal yang terbaca
      finalAmount = subtotalAmount;
    } else if (lineItemAmounts.length > 0) {
      // Skenario 4: Fallback ke item terbesar
      finalAmount = Math.max(...lineItemAmounts);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    const detectedMerchantFinal = detectedMerchant || "Struk Belanja";
    const suggestedCategory = classifyCategory(detectedMerchantFinal, text);
    const detectedDate = extractReceiptDate(text);

    return {
      amount: finalAmount,
      merchant: detectedMerchantFinal,
      suggestedCategory,
      detectedDate,
      latencyMs,
    };
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

      const { amount, merchant, suggestedCategory, detectedDate, latencyMs } =
        extractReceiptData(data.text);

      if (amount <= 0) {
        setError("Teks terbaca, namun total nominal tidak terdeteksi jelas. Silakan periksa atau masukkan nominal manual.");
      }

      onDetected(
        amount,
        merchant,
        data.text,
        {
          spatialAmount: amount,
          spatialMerchant: merchant,
          spatialLatencyMs: latencyMs,
        },
        suggestedCategory,
        detectedDate
      );
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
    <div className="p-4 rounded-2xl bg-white border border-warm-border space-y-4 shadow-xs">
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
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FFF9EC] border border-amber-200 text-orange-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-warm-espresso">
              Pindai Nota Belanja
            </h3>
            <p className="text-[10px] text-stone-500 font-medium">
              Diproses aman langsung di HP kamu
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-stone-500 hover:text-warm-espresso p-1 font-semibold transition"
          >
            Tutup
          </button>
        )}
      </div>

      {/* Image Preview & Scanner Visual */}
      {previewImage ? (
        <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-stone-100 flex items-center justify-center border border-warm-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Foto Nota Belanja"
            className="w-full h-full object-contain"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-warm-honey mb-2" />
              <p className="text-xs font-semibold text-white">{progressStatus}</p>
              <div className="w-40 bg-stone-700 h-1.5 rounded-full mt-2 overflow-hidden border border-stone-600">
                <div
                  className="bg-warm-honey h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 border border-dashed border-warm-border rounded-xl flex flex-col items-center justify-center text-center p-4 bg-[#FFFDF9]">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-amber-200 flex items-center justify-center text-orange-600 mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-warm-espresso">
            Pilih Foto Nota Belanja
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Bisa foto langsung atau pilih dari galeri HP
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons: Kamera vs Galeri */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => cameraInputRef.current?.click()}
          className="min-h-[44px] px-3 rounded-xl bg-[#FFA259] hover:bg-[#F97316] text-stone-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50 border border-orange-300"
        >
          <Camera className="w-4 h-4" />
          Ambil Foto
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[44px] px-3 rounded-xl bg-[#F7F4EE] hover:bg-[#EFE9DF] text-stone-800 border border-warm-border font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          Pilih Galeri
        </button>
      </div>
    </div>
  );
}
