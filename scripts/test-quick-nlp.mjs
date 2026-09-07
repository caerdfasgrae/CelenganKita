const INDO_MONTHS = {
  januari: 0, jan: 0, februari: 1, feb: 1, maret: 2, mar: 2,
  april: 3, apr: 3, mei: 4, juni: 5, jun: 5, juli: 6, jul: 6,
  agustus: 7, agt: 7, agu: 7, september: 8, sep: 8,
  oktober: 9, okt: 9, november: 10, nov: 10, desember: 11, des: 11,
};

function extractDateTimeIndo(raw, baseIso = "2026-09-07T11:40") {
  const [datePart, timePart] = baseIso.split("T");
  const [baseY, baseM, baseD] = datePart.split("-").map(Number);
  const [baseH, baseMin] = timePart.split(":").map(Number);
  const dateObj = new Date(baseY, baseM - 1, baseD, baseH, baseMin);

  let lower = raw.toLowerCase();
  let matchedTokens = [];
  let dayLabel = null;
  let timeLabel = null;
  let dateChanged = false;
  let timeChanged = false;

  // 1. Relative days
  if (/\b(?:kemarin\s+lusa|kmrn\s+lusa)\b/i.test(lower)) {
    const m = lower.match(/\b(?:kemarin\s+lusa|kmrn\s+lusa)\b/i);
    dateObj.setDate(dateObj.getDate() - 2);
    dayLabel = "Kemarin lusa";
    matchedTokens.push(m[0]);
    dateChanged = true;
  } else if (/\b(?:kemarin|kmrn)\b/i.test(lower)) {
    const m = lower.match(/\b(?:kemarin|kmrn)\b/i);
    dateObj.setDate(dateObj.getDate() - 1);
    dayLabel = "Kemarin";
    matchedTokens.push(m[0]);
    dateChanged = true;
  } else if (/\bsemalam\b/i.test(lower)) {
    const m = lower.match(/\bsemalam\b/i);
    dateObj.setDate(dateObj.getDate() - 1);
    dateObj.setHours(20, 0, 0, 0);
    dayLabel = "Semalam";
    matchedTokens.push(m[0]);
    dateChanged = true;
    timeChanged = true;
  } else if (/\btadi\s+malam\b/i.test(lower)) {
    const m = lower.match(/\btadi\s+malam\b/i);
    dateObj.setDate(dateObj.getDate() - 1);
    dateObj.setHours(20, 0, 0, 0);
    dayLabel = "Tadi malam";
    matchedTokens.push(m[0]);
    dateChanged = true;
    timeChanged = true;
  } else if (/\b(\d+)\s*hari\s+lalu\b/i.test(lower)) {
    const m = lower.match(/\b(\d+)\s*hari\s+lalu\b/i);
    const n = parseInt(m[1], 10);
    dateObj.setDate(dateObj.getDate() - n);
    dayLabel = `${n} hari lalu`;
    matchedTokens.push(m[0]);
    dateChanged = true;
  } else if (/\b(\d+)\s*minggu\s+lalu\b/i.test(lower)) {
    const m = lower.match(/\b(\d+)\s*minggu\s+lalu\b/i);
    const n = parseInt(m[1], 10);
    dateObj.setDate(dateObj.getDate() - n * 7);
    dayLabel = `${n} minggu lalu`;
    matchedTokens.push(m[0]);
    dateChanged = true;
  } else if (/\blusa\b/i.test(lower)) {
    const m = lower.match(/\blusa\b/i);
    dateObj.setDate(dateObj.getDate() + 2);
    dayLabel = "Lusa";
    matchedTokens.push(m[0]);
    dateChanged = true;
  } else if (/\bbesok\b/i.test(lower)) {
    const m = lower.match(/\bbesok\b/i);
    dateObj.setDate(dateObj.getDate() + 1);
    dayLabel = "Besok";
    matchedTokens.push(m[0]);
    dateChanged = true;
  } else if (/\bhari\s+ini\b/i.test(lower)) {
    const m = lower.match(/\bhari\s+ini\b/i);
    dayLabel = "Hari ini";
    matchedTokens.push(m[0]);
    dateChanged = true;
  }

  // 2. Explicit date: Day + Month (e.g. "5 sep", "28 agustus")
  const dmMatch = lower.match(/\b(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|agu|agt|sep|okt|nov|des)\b/i);
  if (dmMatch && !dateChanged) {
    const d = parseInt(dmMatch[1], 10);
    const mKey = dmMatch[2].toLowerCase();
    const mIdx = INDO_MONTHS[mKey];
    if (d >= 1 && d <= 31 && mIdx !== undefined) {
      dateObj.setMonth(mIdx, d);
      const cap = mKey.charAt(0).toUpperCase() + mKey.slice(1);
      dayLabel = `${d} ${cap}`;
      matchedTokens.push(dmMatch[0]);
      dateChanged = true;
    }
  }

  // 3. Prefix tgl / tanggal (e.g. "tgl 5", "tanggal 28")
  const tglMatch = lower.match(/\b(?:tgl|tanggal)\s*(\d{1,2})\b/i);
  if (tglMatch && !dateChanged) {
    const d = parseInt(tglMatch[1], 10);
    if (d >= 1 && d <= 31) {
      dateObj.setDate(d);
      dayLabel = `Tgl ${d}`;
      matchedTokens.push(tglMatch[0]);
      dateChanged = true;
    }
  }

  // 4. Standalone month name (e.g. "gaji september 4jt")
  if (!dateChanged) {
    const monthRegex = /\b(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b/i;
    const mMatch = lower.match(monthRegex);
    if (mMatch) {
      const mIdx = INDO_MONTHS[mMatch[1].toLowerCase()];
      if (mIdx !== undefined) {
        dateObj.setMonth(mIdx, 1);
        const cap = mMatch[1].charAt(0).toUpperCase() + mMatch[1].slice(1);
        dayLabel = cap;
        matchedTokens.push(mMatch[0]);
        dateChanged = true;
      }
    }
  }

  // 5. Time of day
  if (!timeChanged) {
    if (/\b(?:tadi\s+pagi|pagi\s+ini|pagi\s+tadi)\b/i.test(lower)) {
      const m = lower.match(/\b(?:tadi\s+pagi|pagi\s+ini|pagi\s+tadi)\b/i);
      dateObj.setHours(8, 0, 0, 0);
      timeLabel = dayLabel ? "Pagi" : "Tadi pagi";
      matchedTokens.push(m[0]);
      timeChanged = true;
    } else if (/\b(?:tadi\s+siang|siang\s+ini|siang\s+tadi)\b/i.test(lower)) {
      const m = lower.match(/\b(?:tadi\s+siang|siang\s+ini|siang\s+tadi)\b/i);
      dateObj.setHours(12, 30, 0, 0);
      timeLabel = dayLabel ? "Siang" : "Tadi siang";
      matchedTokens.push(m[0]);
      timeChanged = true;
    } else if (/\b(?:tadi\s+sore|sore\s+ini|sore\s+tadi)\b/i.test(lower)) {
      const m = lower.match(/\b(?:tadi\s+sore|sore\s+ini|sore\s+tadi)\b/i);
      dateObj.setHours(16, 30, 0, 0);
      timeLabel = dayLabel ? "Sore" : "Tadi sore";
      matchedTokens.push(m[0]);
      timeChanged = true;
    } else if (/\b(?:malam\s+ini|malam\s+tadi)\b/i.test(lower)) {
      const m = lower.match(/\b(?:malam\s+ini|malam\s+tadi)\b/i);
      dateObj.setHours(20, 0, 0, 0);
      timeLabel = dayLabel ? "Malam" : "Malam ini";
      matchedTokens.push(m[0]);
      timeChanged = true;
    } else if (dateChanged && /\b(pagi|siang|sore|malam)\b/i.test(lower)) {
      const m = lower.match(/\b(pagi|siang|sore|malam)\b/i);
      const w = m[1].toLowerCase();
      if (w === "pagi") dateObj.setHours(8, 0, 0, 0);
      if (w === "siang") dateObj.setHours(12, 30, 0, 0);
      if (w === "sore") dateObj.setHours(16, 30, 0, 0);
      if (w === "malam") dateObj.setHours(20, 0, 0, 0);
      timeLabel = w.charAt(0).toUpperCase() + w.slice(1);
      matchedTokens.push(m[0]);
      timeChanged = true;
    }
  }

  // 6. Explicit time: jam / pukul / 14:30
  const jamMatch = lower.match(/\b(?:jam|pukul)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?\b/i);
  if (jamMatch) {
    let h = parseInt(jamMatch[1], 10);
    const min = jamMatch[2] ? parseInt(jamMatch[2], 10) : 0;
    const mod = jamMatch[3]?.toLowerCase();

    if (mod === "malam" && h < 12) h += 12;
    else if (mod === "sore" && h <= 6) h += 12;
    else if (mod === "siang" && h >= 1 && h <= 4) h += 12;

    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      dateObj.setHours(h, min, 0, 0);
      const pad = (n) => n.toString().padStart(2, "0");
      timeLabel = `${pad(h)}:${pad(min)}`;
      matchedTokens.push(jamMatch[0]);
      timeChanged = true;
    }
  } else {
    const ftMatch = lower.match(/(?<![rp\d.,])\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:wib)?\b(?!\s*(?:k|rb|ribu|jt|juta))/i);
    if (ftMatch && ftMatch[2].length === 2) {
      const h = parseInt(ftMatch[1], 10);
      const min = parseInt(ftMatch[2], 10);
      dateObj.setHours(h, min, 0, 0);
      const pad = (n) => n.toString().padStart(2, "0");
      timeLabel = `${pad(h)}:${pad(min)}`;
      matchedTokens.push(ftMatch[0]);
      timeChanged = true;
    }
  }

  const pad = (n) => n.toString().padStart(2, "0");
  const iso = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  const label = [dayLabel, timeLabel].filter(Boolean).join(" ") || null;
  return { iso, label, matchedTokens, isExplicit: dateChanged || timeChanged };
}

function parseAndValidate(text, categories = []) {
  if (!text || typeof text !== "string") {
    return { isValid: false, status: "empty", message: null, parsed: null };
  }

  const raw = text.trim();
  if (!raw) {
    return { isValid: false, status: "empty", message: null, parsed: null };
  }

  // 1. Guardrail: Max length
  if (raw.length > 200) {
    return {
      isValid: false,
      status: "security_blocked",
      message: "Input terlalu panjang (maksimal 200 karakter).",
      parsed: null,
    };
  }

  // 2. Guardrail: XSS & Injection attacks
  const dangerousPatterns = [
    /<(?:script|iframe|object|embed|applet|style)\b/i,
    /javascript:/i,
    /data:text\/html/i,
    /\bon\w+\s*=/i,
    /\b(union\s+select|insert\s+into|delete\s+from|drop\s+(?:table|database|schema)|drop\s+table)\b/i,
    /(--|;\s*--|\/\*|\*\/)/,
    /\b(or|and)\s+['"]?1['"]?\s*=\s*['"]?1/i,
    /\b(?:cmd(?:\.exe)?|powershell|bash|sh|passwd|shadow)\b/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(raw)) {
      return {
        isValid: false,
        status: "security_blocked",
        message: "Karakter atau perintah tidak aman terdeteksi.",
        parsed: null,
      };
    }
  }

  // 3. Extract date and time
  const dt = extractDateTimeIndo(raw);

  // Remove date tokens temporarily for amount matching
  let textForAmount = raw;
  for (const token of dt.matchedTokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    textForAmount = textForAmount.replace(new RegExp(`\\b${escaped}\\b`, "i"), " ");
  }

  // 4. Extract Amount
  let amount = 0;
  let type = "expense";
  let matchedAmountStr = "";

  // Check income indicator
  const incomeRegex = /\b(gaji|bonus|thr|cashback|transfer\s+masuk|dapat\s+uang|jual|penjualan|pemasukan)\b/i;
  if (incomeRegex.test(raw)) {
    type = "income";
  }

  // Match Millions (jt / juta)
  const millionMatch = textForAmount.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(",", "."));
    amount = Math.round(num * 1_000_000);
    matchedAmountStr = millionMatch[0];
  }

  // Match Thousands (rb / ribu / k)
  if (!amount) {
    const thousandMatch = textForAmount.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/i);
    if (thousandMatch) {
      const num = parseFloat(thousandMatch[1].replace(",", "."));
      amount = Math.round(num * 1_000);
      matchedAmountStr = thousandMatch[0];
    }
  }

  // Match standard formatted numbers: Rp 25.000 or 50.000 or plain 25000
  if (!amount) {
    const plainMatch = textForAmount.match(/(?:rp\.?\s*)?(\d{1,3}(?:[.]\d{3})+|\d+)(?![\d:])/i);
    if (plainMatch) {
      const cleaned = plainMatch[1].replace(/\./g, "");
      const num = parseInt(cleaned, 10);
      if (!isNaN(num) && num > 0) {
        amount = num;
        matchedAmountStr = plainMatch[0];
      }
    }
  }

  // 5. Guardrail: Missing Amount
  if (!amount || isNaN(amount) || amount <= 0) {
    const isGreeting = /\b(halo|hai|p|tes|test|assalamualaikum)\b/i.test(raw);
    const helperMsg = isGreeting
      ? "Ketik catatan keuangan, contoh: Kopi 25rb atau Bensin 50k"
      : "Sertakan nominal belanja, contoh: Kopi 25rb atau Bensin 50k";
    return {
      isValid: false,
      status: "missing_amount",
      message: helperMsg,
      parsed: null,
    };
  }

  // 6. Guardrail: Amount limit (Max 1 Miliar Rp)
  if (amount > 1_000_000_000) {
    return {
      isValid: false,
      status: "amount_exceeded",
      message: "Nominal melebihi batas maksimal Rp 1.000.000.000.",
      parsed: null,
    };
  }

  // 7. Clean description: remove amount and date tokens
  let desc = raw;
  if (matchedAmountStr) {
    const escapedAmount = matchedAmountStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    desc = desc.replace(new RegExp(escapedAmount, "i"), " ");
  }
  for (const token of dt.matchedTokens) {
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    desc = desc.replace(new RegExp(escapedToken, "i"), " ");
  }

  desc = desc.replace(/\s+/g, " ").trim();
  desc = desc.replace(/^[-:;,./]+\s*/, "").replace(/\s*[-:;,./]+$/, "").trim();

  if (!desc) {
    desc = type === "income" ? "Pemasukan cepat" : "Belanja cepat";
  } else {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return {
    isValid: true,
    status: "valid",
    message: null,
    parsed: {
      amount,
      type,
      description: desc,
      transactionDate: dt.iso,
      matchedDateLabel: dt.label,
    },
  };
}

const testInputs = [
  "bensin 25rb kemarin",
  "kopi 35k tadi siang",
  "tiket bioskop 100k jam 19:30 kemarin",
  "gaji september 4jt",
  "kopi",
  "halo apa kabar",
  "<script>alert(1)</script>",
  "DROP TABLE transactions; --",
  "beli pulau 2jt juta",
  "beli pulau 2000000000",
];

for (const input of testInputs) {
  const res = parseAndValidate(input);
  console.log(`Input: "${input}"`);
  console.log(`  Status: ${res.status}`);
  if (res.message) console.log(`  Message: ${res.message}`);
  if (res.parsed) {
    console.log(`  Parsed: Amount ${res.parsed.amount} | Desc: "${res.parsed.description}" | Date: ${res.parsed.transactionDate} (${res.parsed.matchedDateLabel})`);
  }
  console.log("---");
}