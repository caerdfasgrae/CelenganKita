// Automated security verification script for CelenganKita Webhook API
// Tests HTTP 400, 401, 413, and payload size & structure bounds

async function runTests() {
  const BASE_URL = "http://localhost:3000/api/v1/webhook/notify";
  console.log("=== MEMULAI SECURITY VERIFICATION MATRIX WEBHOOK ===");

  let passed = 0;
  let total = 0;

  async function testCase(name, url, options, expectedStatus, expectedErrorSnippet) {
    total++;
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let json = {};
      try {
        json = JSON.parse(text);
      } catch (e) {}

      const statusMatch = res.status === expectedStatus;
      const snippetMatch = expectedErrorSnippet
        ? (json.error && json.error.includes(expectedErrorSnippet)) || text.includes(expectedErrorSnippet)
        : true;

      if (statusMatch && snippetMatch) {
        console.log(`[PASS] ${name} -> Status: ${res.status} (Sesuai)`);
        passed++;
      } else {
        console.error(`[FAIL] ${name} -> Expected status ${expectedStatus}, got ${res.status}. Body: ${text}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${name} -> Request failed:`, err.message);
    }
  }

  const VALID_FORMAT_KEY = "ckp_live_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  // 1. Missing Auth header
  await testCase(
    "1. Missing Auth Header",
    BASE_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Transaksi Rp 50.000" }),
    },
    401,
    "wajib disertakan"
  );

  // 2. Invalid Key
  await testCase(
    "2. Invalid Webhook Key",
    BASE_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Celengan-Key": VALID_FORMAT_KEY,
      },
      body: JSON.stringify({ text: "Transaksi Rp 50.000" }),
    },
    401,
    "Kunci API tidak valid"
  );

  // 3. Query Param ?key=... rejection (SEC-002)
  await testCase(
    "3. Query Param ?key=... Rejected",
    `${BASE_URL}?key=secret123`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Celengan-Key": VALID_FORMAT_KEY,
      },
      body: JSON.stringify({ text: "Transaksi Rp 50.000" }),
    },
    400,
    "dilarang"
  );

  // 4. Payload size > 32KB rejection
  const hugeString = "A".repeat(35 * 1024);
  await testCase(
    "4. Payload > 32KB Rejected (413)",
    BASE_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Celengan-Key": VALID_FORMAT_KEY,
      },
      body: JSON.stringify({ text: hugeString }),
    },
    413,
    "32 KB"
  );

  // 5. Malformed JSON
  await testCase(
    "5. Malformed JSON Rejected (400)",
    BASE_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Celengan-Key": VALID_FORMAT_KEY,
      },
      body: "INVALID_JSON{{{{",
    },
    400,
    "JSON payload tidak valid"
  );

  // 6. Notification text too long (> 1000 chars)
  await testCase(
    "6. Text > 1000 chars Rejected (400)",
    BASE_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Celengan-Key": VALID_FORMAT_KEY,
      },
      body: JSON.stringify({ text: "B".repeat(1050) }),
    },
    400,
    "melebihi batas maksimal"
  );

  console.log(`\nHasil: ${passed}/${total} security test cases lolos!`);
}

runTests();
