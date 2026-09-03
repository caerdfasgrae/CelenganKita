import { cleanCurrencyString } from "@/lib/utils";
import { ParsedNotificationResult, TransactionType } from "@/types/database";

interface BankRule {
  appIdentifier: RegExp; // Cocokkan nama app / package name
  canonicalName: string;
  patterns: Array<{
    regex: RegExp;
    type: TransactionType;
    amountGroup: number;
    merchantGroup?: number;
  }>;
}

const BANK_RULES: BankRule[] = [
  // 1. BCA
  {
    appIdentifier: /bca|mybca|klikbca/i,
    canonicalName: "BCA",
    patterns: [
      // QRIS / Belanja
      {
        regex: /(?:transaksi|pembayaran)?\s*qris\s*(?:sebesar)?\s*rp\s*([0-9.,]+)\s*(?:di|ke)\s*([^.,]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // Transfer Keluar
      {
        regex: /(?:transfer|m-transfer).*?(?:ke rek|ke)?\s*([0-9a-z\s/]+)?.*?(?:sebesar|rp)\s*([0-9.,]+)/i,
        type: "expense",
        amountGroup: 2,
        merchantGroup: 1,
      },
      // Transfer Masuk (Kredit)
      {
        regex: /(?:transfer masuk|dana masuk|kredit).*?(?:sebesar|rp)\s*([0-9.,]+)/i,
        type: "income",
        amountGroup: 1,
      },
    ],
  },

  // 2. GoPay
  {
    appIdentifier: /gopay|gojek/i,
    canonicalName: "GoPay",
    patterns: [
      // Pembayaran ke merchant
      {
        regex: /(?:kamu telah membayar|pembayaran)\s*rp\s*([0-9.,]+)\s*(?:ke|di)\s*([^.]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // Transfer keluar GoPay
      {
        regex: /berhasil transfer\s*rp\s*([0-9.,]+)\s*ke\s*([^.]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // Transfer masuk
      {
        regex: /(?:dapet transferan|menerima transfer).*?(?:sebesar)?\s*rp\s*([0-9.,]+)/i,
        type: "income",
        amountGroup: 1,
      },
    ],
  },

  // 3. ShopeePay
  {
    appIdentifier: /shopee/i,
    canonicalName: "ShopeePay",
    patterns: [
      // Pembayaran belanja / QRIS
      {
        regex: /(?:pembayaran|berhasil bayar).*?(?:sebesar)?\s*rp\s*([0-9.,]+)\s*(?:ke|di)\s*([^.]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // Pola ringkas "Berhasil bayar Rp XX"
      {
        regex: /berhasil bayar\s*rp\s*([0-9.,]+)/i,
        type: "expense",
        amountGroup: 1,
      },
      // Saldo masuk
      {
        regex: /(?:menerima transfer|top up berhasil).*?(?:sebesar)?\s*rp\s*([0-9.,]+)/i,
        type: "income",
        amountGroup: 1,
      },
    ],
  },

  // 4. BRI (BRImo)
  {
    appIdentifier: /bri|brimo/i,
    canonicalName: "BRI (BRImo)",
    patterns: [
      // Debit / Pembayaran
      {
        regex: /(?:transaksi debit|debet|transfer berhasil).*?(?:sebesar)?\s*rp\s*([0-9.,]+)(?:.*?(?:ke|di)\s*([^.,]+))?/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // QRIS BRI
      {
        regex: /qris.*?(?:di|ke)\s*([^.,]+).*?rp\s*([0-9.,]+)/i,
        type: "expense",
        amountGroup: 2,
        merchantGroup: 1,
      },
      // Kredit / Masuk
      {
        regex: /(?:transaksi kredit|dana masuk).*?(?:sebesar)?\s*rp\s*([0-9.,]+)/i,
        type: "income",
        amountGroup: 1,
      },
    ],
  },

  // 5. BNI
  {
    appIdentifier: /bni/i,
    canonicalName: "BNI",
    patterns: [
      // Debit / Transfer keluar
      {
        regex: /(?:transaksi debit|transfer dana berhasil).*?(?:sebesar)?\s*rp\s*([0-9.,]+)(?:.*?(?:ke|di)\s*([^.,]+))?/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // QRIS
      {
        regex: /qris.*?rp\s*([0-9.,]+)\s*(?:ke|di)\s*([^.,]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // Kredit
      {
        regex: /(?:transaksi kredit|setoran masuk).*?(?:sebesar)?\s*rp\s*([0-9.,]+)/i,
        type: "income",
        amountGroup: 1,
      },
    ],
  },

  // 6. SeaBank
  {
    appIdentifier: /seabank/i,
    canonicalName: "SeaBank",
    patterns: [
      // Transfer Keluar
      {
        regex: /transfer keluar berhasil\s*(?:sebesar)?\s*rp\s*([0-9.,]+)(?:.*?ke\s*([^.]+))?/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // QRIS SeaBank
      {
        regex: /pembayaran qris berhasil\s*(?:rp\s*)?([0-9.,]+)\s*(?:di|ke)\s*([^.]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      // Transfer Masuk
      {
        regex: /(?:menerima transfer masuk|transfer masuk).*?(?:sebesar)?\s*rp\s*([0-9.,]+)/i,
        type: "income",
        amountGroup: 1,
      },
    ],
  },
];

/**
 * Mem-parse teks notifikasi mentah dari Android menjadi data finansial terstruktur
 */
export function parseBankNotification(
  appNameOrPackage: string,
  rawNotificationText: string
): ParsedNotificationResult {
  const combinedText = rawNotificationText.replace(/\s+/g, " ").trim();

  // 1. Cari kecocokan aturan bank berdasarkan app identifier
  const matchedRule = BANK_RULES.find((rule) =>
    rule.appIdentifier.test(appNameOrPackage) || rule.appIdentifier.test(combinedText)
  );

  if (matchedRule) {
    for (const pattern of matchedRule.patterns) {
      const match = combinedText.match(pattern.regex);
      if (match) {
        const rawAmount = match[pattern.amountGroup];
        const rawMerchant = pattern.merchantGroup ? match[pattern.merchantGroup] : null;

        const amount = cleanCurrencyString(rawAmount);
        if (amount > 0) {
          return {
            sourceApp: matchedRule.canonicalName,
            amount,
            type: pattern.type,
            merchant: rawMerchant ? rawMerchant.trim() : null,
            rawText: combinedText,
            success: true,
          };
        }
      }
    }
  }

  // 2. Fallback Heuristik Umum jika format spesifik tidak persis cocok
  // Cari nominal dengan simbol Rp: "Rp 50.000" atau "Rp50.000"
  const genericRpMatch = combinedText.match(/(?:rp|idr)\s*([0-9.,]{3,})/i);
  if (genericRpMatch && genericRpMatch[1]) {
    const amount = cleanCurrencyString(genericRpMatch[1]);
    if (amount > 0) {
      // Deteksi tipe pemasukan vs pengeluaran
      const isIncome = /masuk|kredit|diterima|menerima|top up/i.test(combinedText);
      return {
        sourceApp: matchedRule ? matchedRule.canonicalName : appNameOrPackage || "Bank/E-Wallet",
        amount,
        type: isIncome ? "income" : "expense",
        merchant: null,
        rawText: combinedText,
        success: true,
      };
    }
  }

  // Gagal parse nominal
  return {
    sourceApp: matchedRule ? matchedRule.canonicalName : appNameOrPackage || "Unknown",
    amount: 0,
    type: "expense",
    merchant: null,
    rawText: combinedText,
    success: false,
  };
}
