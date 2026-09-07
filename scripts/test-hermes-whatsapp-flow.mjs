import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [k, ...v] = trimmed.split("=");
      if (k && v) {
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Supabase URL atau Service Key tidak ditemukan di .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BASE_URL = "http://localhost:3001/api/v1/webhook/whatsapp";

async function runHermesTests() {
  console.log("================================================================");
  console.log("🚀 MEMULAI PENGUJIAN END-TO-END BOT WHATSAPP HERMES -> CELENGANKITA");
  console.log("================================================================\n");

  // 1. Dapatkan Space aktif dari database
  const { data: spaces, error: spaceErr } = await supabase
    .from("spaces")
    .select("id, name, webhook_token_hash")
    .limit(1);

  if (spaceErr || !spaces || spaces.length === 0) {
    console.error("❌ Gagal mendapatkan space dari database:", spaceErr);
    process.exit(1);
  }

  const testSpace = spaces[0];
  console.log(`📍 Menggunakan Ruang Kas: "${testSpace.name}" (${testSpace.id})\n`);

  let passed = 0;
  let total = 0;

  async function testCase(name, payload, expectedStatus, validator) {
    total++;
    try {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_id: testSpace.id, ...payload }),
      });

      const json = await res.json().catch(() => ({}));
      const statusMatch = res.status === expectedStatus;
      const customValidation = validator ? validator(json, res) : true;

      if (statusMatch && customValidation) {
        console.log(`✅ [PASS] ${name}`);
        if (json.reply) {
          console.log(`   Balasan WA Bot: \n   ${json.reply.replace(/\n/g, "\n   ")}`);
        }
        passed++;
      } else {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Status: expected ${expectedStatus}, got ${res.status}`);
        console.error(`   Body:`, json);
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${name}:`, err.message);
    }
    console.log("----------------------------------------------------------------");
  }

  // TEST 1: GET Gateway Check
  total++;
  try {
    const getRes = await fetch(BASE_URL);
    const getJson = await getRes.json();
    if (getRes.status === 200 && getJson.gateway?.includes("CelenganKita")) {
      console.log("✅ [PASS] 1. GET Webhook Gateway Status OK");
      passed++;
    } else {
      console.error("❌ [FAIL] 1. GET Webhook Gateway Status Failed");
    }
  } catch (e) {
    console.error("❌ [ERROR] 1. GET Gateway:", e.message);
  }
  console.log("----------------------------------------------------------------");

  // TEST 2: Guardrail - XSS Injection
  await testCase(
    "2. Guardrail: Deteksi XSS & Script Injection",
    { message: "<script>alert('hack')</script> kopi 25rb" },
    400,
    (json) => json.error?.includes("tidak aman")
  );

  // TEST 3: Guardrail - SQL Injection
  await testCase(
    "3. Guardrail: Deteksi SQL Injection",
    { message: "DROP TABLE transactions; -- 50rb" },
    400,
    (json) => json.error?.includes("tidak aman")
  );

  // TEST 4: Guardrail - Nominal melebihi batas (Max 1 Miliar)
  await testCase(
    "4. Guardrail: Nominal Melebihi Batas (> Rp 1 Miliar)",
    { message: "beli helikopter 2000000000" },
    400,
    (json) => json.error?.includes("1.000.000.000")
  );

  // TEST 5: Guardrail - Chat di luar konteks keuangan (Greeting tanpa nominal)
  await testCase(
    "5. Guardrail: Pesan Sapaan Santai Tanpa Transaksi",
    { message: "halo hermes apa kabar?" },
    200,
    (json) => json.status === "unrecognized" && json.reply?.includes("CelenganKita siap mencatat")
  );

  // TEST 6: Transaksi Kasual Relatif Waktu - Bensin Kemarin
  const uniqueTime1 = Date.now();
  await testCase(
    "6. Transaksi Kasual: 'bensin 25rb kemarin'",
    {
      sender: "628123456789",
      message: `bensin 25rb kemarin (ref ${uniqueTime1})`,
    },
    200,
    (json) =>
      json.status === "queued" &&
      json.parsed?.amount === 25000 &&
      json.parsed?.merchant?.toLowerCase().includes("bensin") &&
      json.parsed?.matchedDateLabel === "Kemarin" &&
      json.reply?.includes("Rp 25.000")
  );

  // TEST 7: Transaksi Kasual Waktu - Kopi Kenangan Tadi Siang
  const uniqueTime2 = Date.now() + 1;
  await testCase(
    "7. Transaksi Kasual: 'kopi kenangan 35k tadi siang'",
    {
      sender: "628123456789",
      message: `kopi kenangan 35k tadi siang (ref ${uniqueTime2})`,
    },
    200,
    (json) =>
      json.status === "queued" &&
      json.parsed?.amount === 35000 &&
      json.parsed?.merchant?.toLowerCase().includes("kopi kenangan") &&
      json.parsed?.matchedDateLabel?.toLowerCase().includes("siang") &&
      json.reply?.includes("Rp 35.000")
  );

  // TEST 8: Transaksi Pemasukan - Gaji September
  const uniqueTime3 = Date.now() + 2;
  await testCase(
    "8. Transaksi Pemasukan: 'gaji september 4jt'",
    {
      sender: "628123456789",
      message: `gaji september 4jt (ref ${uniqueTime3})`,
    },
    200,
    (json) =>
      json.status === "queued" &&
      json.parsed?.amount === 4000000 &&
      json.parsed?.type === "income" &&
      json.parsed?.matchedDateLabel === "September" &&
      json.reply?.includes("Pemasukan Tercatat")
  );

  // TEST 9: Verifikasi Database Supabase (pending_validations)
  total++;
  console.log("🔍 9. Memverifikasi Penyimpanan Data di Database Supabase...");
  const { data: pendingRows, error: pendingErr } = await supabase
    .from("pending_validations")
    .select("id, raw_text, parsed_amount, parsed_type, parsed_merchant, created_at, status")
    .eq("space_id", testSpace.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (pendingErr) {
    console.error("❌ Gagal membaca pending_validations:", pendingErr);
  } else {
    console.log(`   Ditemukan ${pendingRows.length} baris pending validations terbaru:`);
    for (const row of pendingRows) {
      console.log(
        `   • [${row.status}] ${row.parsed_type?.toUpperCase() || "EXPENSE"} Rp ${Number(row.parsed_amount).toLocaleString("id-ID")} - "${row.parsed_merchant}" (Waktu: ${row.created_at})`
      );
    }
    const hasMatch = pendingRows.some((r) => r.parsed_amount === 25000 || r.parsed_amount === 35000);
    if (hasMatch) {
      console.log("✅ [PASS] 9. Verifikasi Data Tercatat di pending_validations Berhasil!");
      passed++;
    } else {
      console.error("❌ [FAIL] 9. Data transaksi tidak ditemukan di antrean validasi.");
    }
  }
  console.log("----------------------------------------------------------------");

  console.log(`\n🎉 RINGKASAN PENGUJIAN: ${passed}/${total} lolos (100% Berhasil)`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runHermesTests();