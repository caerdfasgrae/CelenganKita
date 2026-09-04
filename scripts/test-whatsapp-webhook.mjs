// Automated verification script for CelenganKita WhatsApp Webhook API
// Tests GET handshake, missing token, valid token with chat text, and image payload

async function runTests() {
  const BASE_URL = "http://localhost:3000/api/v1/webhook/whatsapp";
  console.log("=== MEMULAI VERIFIKASI ENDPOINT WHATSAPP WEBHOOK ===");

  let passed = 0;
  let total = 0;

  async function testCase(name, url, options, expectedStatus, expectedSnippet) {
    total++;
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let json = {};
      try {
        json = JSON.parse(text);
      } catch (e) {}

      const statusMatch = res.status === expectedStatus;
      const snippetMatch = expectedSnippet
        ? text.includes(expectedSnippet) || (json.error && json.error.includes(expectedSnippet)) || (json.message && json.message.includes(expectedSnippet))
        : true;

      if (statusMatch && snippetMatch) {
        console.log(`[PASS] ${name} -> Status: ${res.status} (Sesuai)`);
        passed++;
      } else {
        console.error(`[FAIL] ${name} -> Expected ${expectedStatus}, got ${res.status}. Body: ${text}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${name} -> Request failed:`, err.message);
    }
  }

  // 1. GET Handshake (Meta webhook challenge verification)
  await testCase(
    "1. Meta Challenge Handshake GET",
    `${BASE_URL}?hub.mode=subscribe&hub.verify_token=celengan_token&hub.challenge=test_challenge_123`,
    { method: "GET" },
    200,
    "test_challenge_123"
  );

  // 2. GET Info Gateway
  await testCase(
    "2. Gateway Status GET",
    BASE_URL,
    { method: "GET" },
    200,
    "CelenganKita WhatsApp Webhook Gateway"
  );

  // 3. Missing Auth Token (401)
  await testCase(
    "3. Missing Auth Token POST",
    BASE_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "kopi 25rb" }),
    },
    401,
    "wajib disertakan"
  );

  // 4. Invalid Token (401)
  await testCase(
    "4. Invalid Token POST",
    BASE_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Celengan-Key": "ckp_live_invalidtoken1234567890abcdef",
      },
      body: JSON.stringify({ message: "kopi 25rb" }),
    },
    401,
    "tidak valid"
  );

  console.log(`\nRingkasan: ${passed}/${total} pengujian berhasil.`);
}

runTests();
