import { parseBankNotification } from "../src/lib/parser/bank-notification.js";

console.log("=== PENGUJIAN PARSER CHAT WHATSAPP & SMS ===");

const testCases = [
  { text: "kopi 25rb", expectedAmount: 25000, expectedMerchant: "kopi" },
  { text: "makan siang 45k", expectedAmount: 45000, expectedMerchant: "makan siang" },
  { text: "beli bensin 50.000", expectedAmount: 50000, expectedMerchant: "bensin" },
  { text: "50rb buat makan malam", expectedAmount: 50000, expectedMerchant: "makan malam" },
  { text: "1.5jt bayar kontrakan", expectedAmount: 1500000, expectedMerchant: "kontrakan" },
  {
    text: "BCA: 04/09 14:20 QRIS SEBESAR RP 45.000 DI KOPI KENANGAN SUKSES",
    expectedAmount: 45000,
    expectedMerchant: "KOPI KENANGAN",
  },
  {
    text: "Kamu telah membayar Rp 32.500 ke WARUNG MAKAN BU JOKO",
    expectedAmount: 32500,
    expectedMerchant: "WARUNG MAKAN BU JOKO",
  },
];

let passed = 0;
for (const tc of testCases) {
  const res = parseBankNotification("WhatsApp", tc.text);
  const amountOk = res.amount === tc.expectedAmount;
  const merchantOk = !tc.expectedMerchant || res.merchant?.toLowerCase() === tc.expectedMerchant.toLowerCase();
  
  if (amountOk && merchantOk) {
    console.log(`✅ PASS: "${tc.text}" -> Rp ${res.amount.toLocaleString()} (${res.merchant})`);
    passed++;
  } else {
    console.error(`❌ FAIL: "${tc.text}"`);
    console.error(`   Got: Amount ${res.amount}, Merchant "${res.merchant}"`);
    console.error(`   Expected: Amount ${tc.expectedAmount}, Merchant "${tc.expectedMerchant}"`);
  }
}

console.log(`\nHasil: ${passed}/${testCases.length} lolos.`);
if (passed === testCases.length) {
  process.exit(0);
} else {
  process.exit(1);
}
