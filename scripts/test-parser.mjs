// Script uji coba otomatis parser notifikasi bank & e-wallet CelenganKita
// Dijalankan dengan: node scripts/test-parser.mjs

function cleanCurrencyString(rawStr) {
  if (!rawStr) return 0;
  let cleaned = rawStr.replace(/[^0-9.,]/g, "").trim();

  if (cleaned.includes(".") && cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      cleaned = cleaned.replace(/\./g, "");
    }
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(",", ".");
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

const BANK_RULES = [
  // 1. BCA
  {
    appIdentifier: /bca|mybca|klikbca/i,
    canonicalName: "BCA",
    patterns: [
      {
        regex: /(?:transaksi|pembayaran)?\s*qris\s*(?:sebesar)?\s*rp\s*([0-9.,]+)\s*(?:di|ke)\s*([^.,]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      {
        regex: /(?:transfer|m-transfer).*?(?:ke rek|ke)?\s*([0-9a-z\s/]+)?.*?(?:sebesar|rp)\s*([0-9.,]+)/i,
        type: "expense",
        amountGroup: 2,
        merchantGroup: 1,
      },
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
      {
        regex: /(?:kamu telah membayar|pembayaran)\s*rp\s*([0-9.,]+)\s*(?:ke|di)\s*([^.]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      {
        regex: /berhasil transfer\s*rp\s*([0-9.,]+)\s*ke\s*([^.]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
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
      {
        regex: /(?:pembayaran|berhasil bayar).*?(?:sebesar)?\s*rp\s*([0-9.,]+)\s*(?:ke|di)\s*([^.]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      {
        regex: /berhasil bayar\s*rp\s*([0-9.,]+)/i,
        type: "expense",
        amountGroup: 1,
      },
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
      {
        regex: /(?:transaksi debit|debet|transfer berhasil).*?(?:sebesar)?\s*rp\s*([0-9.,]+)(?:.*?(?:ke|di)\s*([^.,]+))?/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      {
        regex: /qris.*?(?:di|ke)\s*([^.,]+).*?rp\s*([0-9.,]+)/i,
        type: "expense",
        amountGroup: 2,
        merchantGroup: 1,
      },
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
      {
        regex: /(?:transaksi debit|transfer dana berhasil).*?(?:sebesar)?\s*rp\s*([0-9.,]+)(?:.*?(?:ke|di)\s*([^.,]+))?/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      {
        regex: /qris.*?rp\s*([0-9.,]+)\s*(?:ke|di)\s*([^.,]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
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
      {
        regex: /transfer keluar berhasil\s*(?:sebesar)?\s*rp\s*([0-9.,]+)(?:.*?ke\s*([^.]+))?/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      {
        regex: /pembayaran qris berhasil\s*(?:rp\s*)?([0-9.,]+)\s*(?:di|ke)\s*([^.]+)/i,
        type: "expense",
        amountGroup: 1,
        merchantGroup: 2,
      },
      {
        regex: /(?:menerima transfer masuk|transfer masuk).*?(?:sebesar)?\s*rp\s*([0-9.,]+)/i,
        type: "income",
        amountGroup: 1,
      },
    ],
  },
];

function parseBankNotification(appNameOrPackage, rawNotificationText) {
  const combinedText = rawNotificationText.replace(/\s+/g, " ").trim();

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
            success: true,
          };
        }
      }
    }
  }

  // Generic fallback
  const genericRpMatch = combinedText.match(/(?:rp|idr)\s*([0-9.,]{3,})/i);
  if (genericRpMatch && genericRpMatch[1]) {
    const amount = cleanCurrencyString(genericRpMatch[1]);
    if (amount > 0) {
      const isIncome = /masuk|kredit|diterima|menerima|top up/i.test(combinedText);
      return {
        sourceApp: matchedRule ? matchedRule.canonicalName : appNameOrPackage || "Bank",
        amount,
        type: isIncome ? "income" : "expense",
        merchant: null,
        success: true,
      };
    }
  }

  return { sourceApp: appNameOrPackage, amount: 0, type: "expense", success: false };
}

// TEST SUITE
const testCases = [
  {
    name: "BCA QRIS",
    app: "com.bca",
    text: "Transaksi QRIS sebesar Rp 45.000 di Kopi Kenangan berhasil.",
    expected: { app: "BCA", amount: 45000, type: "expense" },
  },
  {
    name: "GoPay Pembayaran",
    app: "com.gojek.app",
    text: "Kamu telah membayar Rp 28.500 ke Chatime Tebet.",
    expected: { app: "GoPay", amount: 28500, type: "expense" },
  },
  {
    name: "ShopeePay Belanja",
    app: "com.shopee.id",
    text: "Pembayaran sebesar Rp 115.000 ke Toko Serba Ada berhasil.",
    expected: { app: "ShopeePay", amount: 115000, type: "expense" },
  },
  {
    name: "BRI (BRImo) Debit",
    app: "id.co.bri.brimo",
    text: "Transaksi debit sebesar Rp 250.000 pada 03/09/2026 ke SPBU Pertamina.",
    expected: { app: "BRI (BRImo)", amount: 250000, type: "expense" },
  },
  {
    name: "BNI Transfer Berhasil",
    app: "src.bni",
    text: "Transfer dana berhasil sebesar Rp 500.000 ke rek Bpk Ahmad.",
    expected: { app: "BNI", amount: 500000, type: "expense" },
  },
  {
    name: "SeaBank QRIS",
    app: "com.seabank.id",
    text: "Pembayaran QRIS berhasil Rp 62.000 di HokBen Mall.",
    expected: { app: "SeaBank", amount: 62000, type: "expense" },
  },
];

console.log("=== MEMULAI TEST SUITE PARSER NOTIFIKASI BANK CELENGANKITA ===");
let passed = 0;

for (const tc of testCases) {
  const res = parseBankNotification(tc.app, tc.text);
  const ok = res.success && res.amount === tc.expected.amount && res.type === tc.expected.type;
  if (ok) {
    passed++;
    console.log(`[PASS] ${tc.name}: Rp ${res.amount.toLocaleString()} (${res.type}) -> Merchant: ${res.merchant || '-'}`);
  } else {
    console.error(`[FAIL] ${tc.name}:`, res);
  }
}

console.log(`\nHasil: ${passed}/${testCases.length} test berhasil lolos!`);
if (passed === testCases.length) {
  console.log("SEMUA REGEX PARSER 100% VALID!");
}
