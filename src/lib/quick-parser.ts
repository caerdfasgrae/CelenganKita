import { Category } from "@/types/database";

export interface ParsedQuickExpense {
  amount: number;
  type: "income" | "expense";
  description: string;
  matchedCategoryName: string | null;
  suggestedCategoryId: string;
}

/**
 * Natural language expense parser for Indonesian inputs.
 * Parses expressions like:
 * - "Kopi susu 25rb" -> amount: 25000, desc: "Kopi susu", cat: "Makan & Minum"
 * - "Bensin pertalite 50k" -> amount: 50000, desc: "Bensin pertalite", cat: "Transportasi"
 * - "Nasi padang 35.000" -> amount: 35000, desc: "Nasi padang", cat: "Makan & Minum"
 * - "1.5jt gaji bulanan" -> amount: 1500000, type: "income", desc: "Gaji bulanan", cat: "Gaji"
 */
export function parseQuickInput(
  text: string,
  categories: Category[] = []
): ParsedQuickExpense | null {
  if (!text || typeof text !== "string") return null;
  const raw = text.trim();
  if (!raw) return null;

  let amount = 0;
  let type: "income" | "expense" = "expense";

  // 1. Check for income indicators
  const incomeRegex = /\b(gaji|bonus|thr|cashback|transfer\s+masuk|dapat\s+uang|jual|penjualan|pemasukan)\b/i;
  if (incomeRegex.test(raw)) {
    type = "income";
  }

  // 2. Parse Amount
  let matchedAmountStr = "";

  // Match Millions (jt / juta)
  const millionMatch = raw.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(",", "."));
    amount = Math.round(num * 1_000_000);
    matchedAmountStr = millionMatch[0];
  }

  // Match Thousands (rb / ribu / k)
  if (!amount) {
    const thousandMatch = raw.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/i);
    if (thousandMatch) {
      const num = parseFloat(thousandMatch[1].replace(",", "."));
      amount = Math.round(num * 1_000);
      matchedAmountStr = thousandMatch[0];
    }
  }

  // Match standard formatted numbers: Rp 25.000 or 50.000 or plain 25000
  if (!amount) {
    const plainMatch = raw.match(/(?:rp\.?\s*)?(\d{1,3}(?:[.]\d{3})+|\d+)/i);
    if (plainMatch) {
      const cleaned = plainMatch[1].replace(/\./g, "");
      const num = parseInt(cleaned, 10);
      if (!isNaN(num) && num > 0) {
        amount = num;
        matchedAmountStr = plainMatch[0];
      }
    }
  }

  // If no valid amount found, return null
  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // 3. Extract description by removing matched amount and extra punctuation
  let desc = raw.replace(matchedAmountStr, " ").replace(/\s+/g, " ").trim();
  desc = desc.replace(/^[-:;,./]+\s*/, "").replace(/\s*[-:;,./]+$/, "").trim();

  if (!desc) {
    desc = type === "income" ? "Pemasukan cepat" : "Belanja cepat";
  } else {
    // Capitalize first letter
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  // 4. Suggest Category using dictionary matching
  const keywordsMap: Record<string, string[]> = {
    "Makan & Minum": [
      "kopi", "coffee", "susu", "nasi", "ayam", "soto", "bakso", "mie", "ramen",
      "burger", "pizza", "cafe", "resto", "warung", "padang", "gultik", "roti",
      "toast", "jus", "teh", "es", "boba", "sarapan", "lunch", "makan", "dinner",
      "snack", "jajan", "martabak", "mcd", "kfc", "dunkin", "geprek", "seblak"
    ],
    "Kesehatan": [
      "obat", "dokter", "apotek", "vitamin", "panadol", "tolak angin", "bodrex",
      "paracetamol", "lab", "periksa", "dokter gigi", "klinik", "betadine",
      "minyak kayu putih", "masker", "rapid"
    ],
    "Transportasi": [
      "bensin", "pertalite", "pertamax", "spbu", "ojol", "gojek", "goride", "gocar",
      "grab", "parkir", "tol", "kereta", "krl", "mrt", "tj", "transjakarta",
      "tambal", "helm", "cuci motor", "cuci mobil", "bbm", "angkot"
    ],
    "Belanja Bulanan": [
      "supermarket", "indomaret", "alfamart", "alfamidi", "sabun", "shampoo",
      "deterjen", "minyak", "beras", "telur", "belanja dapur", "pasar", "sayur",
      "buah", "kebutuhan", "galon", "aqua", "odol", "tisu"
    ],
    "Tagihan & Utilitas": [
      "listrik", "pln", "token", "air", "pdam", "wifi", "indihome", "firstmedia",
      "kuota", "telkomsel", "xl", "indosat", "pulsa", "bpjs", "netflix", "spotify",
      "iuran", "pbb"
    ],
    "Hiburan & Liburan": [
      "nonton", "bioskop", "xxi", "cgv", "tiket", "game", "steam", "liburan",
      "hotel", "villa", "staycation", "piknik", "karaoke", "dufan"
    ],
    "Gaji & Pendapatan": [
      "gaji", "payroll", "bonus", "komisi", "cashback", "dividen", "penjualan", "thr"
    ]
  };

  const lowerDesc = desc.toLowerCase();
  let matchedCatName: string | null = null;

  for (const [catName, keywords] of Object.entries(keywordsMap)) {
    for (const kw of keywords) {
      if (kw.length <= 3) {
        const wordRegex = new RegExp(`\\b${kw}\\b`, "i");
        if (wordRegex.test(lowerDesc)) {
          matchedCatName = catName;
          break;
        }
      } else {
        if (lowerDesc.includes(kw)) {
          matchedCatName = catName;
          break;
        }
      }
    }
    if (matchedCatName) break;
  }

  let suggestedCategoryId = "";
  if (categories && categories.length > 0) {
    if (matchedCatName) {
      const found = categories.find(
        (c) =>
          c.name.toLowerCase().includes(matchedCatName!.toLowerCase()) ||
          matchedCatName!.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) suggestedCategoryId = found.id;
    }
    if (!suggestedCategoryId) {
      const defaultCat = categories.find((c) => c.type === type);
      if (defaultCat) {
        suggestedCategoryId = defaultCat.id;
      } else if (categories[0]) {
        suggestedCategoryId = categories[0].id;
      }
    }
  }

  return {
    amount,
    type,
    description: desc,
    matchedCategoryName: matchedCatName,
    suggestedCategoryId,
  };
}
