import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBankNotification } from "@/lib/parser/bank-notification";
import { validateQuickInput } from "@/lib/quick-parser";
import { sha256 } from "@/lib/utils";

// Verifikasi webhook untuk gateway seperti Meta Cloud API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    // Berikan respons challenge ke platform webhook
    return new NextResponse(challenge || "OK", { status: 200 });
  }

  return NextResponse.json({
    status: "active",
    gateway: "CelenganKita WhatsApp Webhook Gateway",
    version: "1.0.0",
    hint: "Kirim POST request dengan header 'X-Celengan-Key' atau token di payload.",
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Ekstraksi Token / Kunci Space
    const authHeader = request.headers.get("authorization");
    const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    let apiKey = request.headers.get("x-celengan-key")?.trim() || bearerKey;

    let body: any = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Format JSON payload tidak valid." }, { status: 400 });
      }
    } else {
      try {
        const formData = await request.formData();
        const entries: Record<string, any> = {};
        formData.forEach((val, key) => {
          entries[key] = val;
        });
        body = entries;
      } catch {
        return NextResponse.json({ error: "Gagal membaca body payload." }, { status: 400 });
      }
    }

    // 2. Hubungkan ke Ruang Anggaran (Space)
    const supabase = createAdminClient();
    let space: { id: string; name: string } | null = null;

    if (apiKey) {
      const hashedKey = await sha256(apiKey.trim());
      const { data } = await supabase
        .from("spaces")
        .select("id, name")
        .eq("webhook_token_hash", hashedKey)
        .single();
      space = data;

      if (!space) {
        return NextResponse.json(
          { error: "Kunci API webhook tidak valid." },
          { status: 401 }
        );
      }
    }

    const spaceIdParam =
      (body.space_id as string) ||
      (body.spaceId as string) ||
      request.nextUrl.searchParams.get("space_id") ||
      request.nextUrl.searchParams.get("spaceId");

    if (!space && spaceIdParam) {
      const { data } = await supabase
        .from("spaces")
        .select("id, name")
        .eq("id", spaceIdParam)
        .single();
      space = data;
    }

    // Resolusi otomatis cadangan jika hanya ada 1 space di database
    if (!space && !apiKey && !spaceIdParam) {
      const { data: spaces } = await supabase.from("spaces").select("id, name").limit(2);
      if (spaces && spaces.length === 1) {
        space = spaces[0];
      }
    }

    if (!space) {
      return NextResponse.json(
        {
          error:
            "Kunci API atau parameter space_id wajib disertakan untuk menghubungkan ke Ruang Anggaran.",
        },
        { status: 401 }
      );
    }

    // 3. Normalisasi Payload Pesan Masuk (Support Meta Cloud API, Hermes, Fonnte, Wablas, Baileys)
    let rawText = "";
    let sender = "";
    let mediaUrl: string | null = null;
    let isImage = false;

    // A. Meta WhatsApp Cloud API format
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = body.entry[0].changes[0].value.messages[0];
      sender = msg.from || "";
      if (msg.type === "text") {
        rawText = msg.text?.body || "";
      } else if (msg.type === "image") {
        isImage = true;
        rawText = msg.image?.caption || "Foto struk/bukti bayar dari WhatsApp";
        mediaUrl = msg.image?.url || msg.image?.id || null;
      }
    } else {
      // B. Bot WhatsApp Hermes / Gateway Lokal (Fonnte, Wablas, Baileys, direct)
      sender = (body.sender || body.from || body.phone || "").toString();
      rawText = (body.message || body.text || body.caption || body.body || "").toString().trim();

      const potentialMedia = body.url || body.image || body.file || body.media || body.media_url;
      if (potentialMedia) {
        isImage = true;
        mediaUrl = typeof potentialMedia === "string" ? potentialMedia : null;
        if (!rawText) {
          rawText = "Foto struk/bukti bayar dari WhatsApp";
        }
      }
    }

    if (!rawText && !isImage) {
      return NextResponse.json(
        { error: "Pesan teks atau lampiran gambar tidak ditemukan dalam payload." },
        { status: 400 }
      );
    }

    // 4. Guardrail Keamanan: Cegah pola serangan injeksi skrip, HTML, atau SQL
    const isDangerous =
      /<(?:script|iframe|object|embed|applet|style)\b/i.test(rawText) ||
      /\b(union\s+select|insert\s+into|delete\s+from|drop\s+(?:table|database|schema)|drop\s+table)\b/i.test(
        rawText
      ) ||
      /(--|;\s*--|\/\*|\*\/)/.test(rawText) ||
      /\b(?:cmd(?:\.exe)?|powershell|bash|sh|passwd|shadow)\b/i.test(rawText);

    if (isDangerous) {
      return NextResponse.json(
        {
          error: "Pesan diblokir karena mengandung pola karakter tidak aman.",
          reply: "⚠️ Pesan dibatalkan: Karakter tidak aman terdeteksi.",
        },
        { status: 400 }
      );
    }

    // 5. Muat Kategori Space untuk Pencocokan Otomatis
    const { data: spaceCategories } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("space_id", space.id);

    // 6. Proses Ekstraksi Finansial (Bank Notification vs Catat Cepat NLP)
    let sourceApp = isImage ? "WhatsApp (Foto)" : "WhatsApp";
    let parsedAmount = 0;
    let parsedMerchant: string | null = null;
    let parsedType: "income" | "expense" = "expense";
    let suggestedCategoryId: string | null = null;
    let transactionDate: string | null = null;
    let matchedDateLabel: string | null = null;

    // Prioritas A: Coba parse format notifikasi perbankan / SMS resmi (BCA, BRI, GoPay, dll)
    const bankParsed = parseBankNotification("WhatsApp", rawText);
    if (
      bankParsed.success &&
      bankParsed.amount > 0 &&
      bankParsed.sourceApp !== "WhatsApp" &&
      bankParsed.sourceApp !== "Unknown"
    ) {
      parsedAmount = bankParsed.amount;
      parsedMerchant = bankParsed.merchant;
      parsedType = bankParsed.type;
      sourceApp = bankParsed.sourceApp;
    }

    // Prioritas B: Catat Cepat NLP (Bahasa santai: "bensin 25rb kemarin", "kopi kenangan 35k tadi siang")
    if (parsedAmount === 0 && !isImage) {
      const quickValidation = validateQuickInput(rawText, spaceCategories || []);

      if (quickValidation.isValid && quickValidation.parsed) {
        parsedAmount = quickValidation.parsed.amount;
        parsedMerchant = quickValidation.parsed.description;
        parsedType = quickValidation.parsed.type;
        suggestedCategoryId = quickValidation.parsed.suggestedCategoryId || null;
        transactionDate = quickValidation.parsed.transactionDate;
        matchedDateLabel = quickValidation.parsed.matchedDateLabel;
        sourceApp = "WhatsApp (Catat Cepat)";
      } else if (quickValidation.status === "amount_exceeded") {
        return NextResponse.json(
          {
            error: quickValidation.message,
            reply: "⚠️ Nominal melebihi batas maksimal Rp 1.000.000.000.",
          },
          { status: 400 }
        );
      } else if (quickValidation.status === "missing_amount") {
        // Balasan ramah jika pesan hanya berupa sapaan atau percakapan di luar transaksi
        return NextResponse.json({
          status: "unrecognized",
          message: "Format catatan tidak memiliki nominal transaksi.",
          reply: `👋 Halo! CelenganKita siap mencatat transaksi kas bersama.\n\nContoh ketikan:\n• Kopi 25rb kemarin\n• Bensin 50k tadi siang\n• Gaji 4jt\n• Atau kirim foto nota/struk belanja 📸`,
        });
      }
    }

    // Jika lewat bank notification dan belum ada kategori, cocokkan menggunakan dictionary
    if (parsedAmount > 0 && !suggestedCategoryId && parsedMerchant && spaceCategories) {
      const quickCheck = validateQuickInput(`${parsedMerchant} ${parsedAmount}`, spaceCategories);
      if (quickCheck.parsed?.suggestedCategoryId) {
        suggestedCategoryId = quickCheck.parsed.suggestedCategoryId;
      }
    }

    // 7. Hitung Idempotency Hash Anti-Duplikasi
    const dateHour = new Date().toISOString().slice(0, 13);
    const idempotencyString = `${space.id}_${sourceApp}_${rawText}_${dateHour}`;
    const idempotencyHash = await sha256(idempotencyString);

    // 8. HUMAN-IN-THE-LOOP: Selalu masukkan ke pending_validations (TIDAK langsung ke transactions)
    const insertPayload: any = {
      space_id: space.id,
      raw_text: isImage && mediaUrl ? `[Gambar: ${mediaUrl}] ${rawText}` : rawText,
      source_app: sourceApp,
      parsed_amount: parsedAmount > 0 ? parsedAmount : null,
      parsed_type: parsedType,
      parsed_merchant: parsedMerchant,
      suggested_category_id: suggestedCategoryId,
      status: "pending",
      idempotency_hash: idempotencyHash,
    };

    if (transactionDate) {
      insertPayload.created_at =
        transactionDate.includes("Z") || transactionDate.includes("+")
          ? transactionDate
          : `${transactionDate}:00+07:00`;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("pending_validations")
      .upsert(insertPayload, { onConflict: "idempotency_hash", ignoreDuplicates: true })
      .select("id, created_at");

    if (insertError && (insertError as any).code !== "23505") {
      console.error("Gagal mencatat pending validation dari WhatsApp:", insertError);
      return NextResponse.json(
        { error: "Gagal memproses notifikasi WhatsApp ke antrean." },
        { status: 500 }
      );
    }

    // Jika duplikat
    const isDuplicate = !insertError && (!inserted || inserted.length === 0);

    // 9. Susun Pesan Balasan WhatsApp Ramah & Informatif
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://celengan-kita-two.vercel.app";
    const validationUrl = `${siteUrl}/validations`;

    let replyMessage = "";
    if (isDuplicate) {
      replyMessage =
        "ℹ️ Transaksi ini sudah pernah diterima sebelumnya dan ada di antrean validasi CelenganKita.";
    } else if (parsedAmount > 0) {
      const formattedAmount = `Rp ${parsedAmount.toLocaleString("id-ID")}`;
      const noteText = parsedMerchant ? `\n📝 Catatan: ${parsedMerchant}` : "";
      const catObj = spaceCategories?.find((c) => c.id === suggestedCategoryId);
      const catText = catObj ? `\n🏷️ Kategori: ${catObj.name}` : "";
      const timeText = matchedDateLabel ? `\n📅 Waktu: ${matchedDateLabel}` : "";
      const typeHeader = parsedType === "income" ? "Pemasukan" : "Pengeluaran";

      replyMessage = `✅ *${typeHeader} Tercatat di Antrean!*\n\n💰 Nominal: ${formattedAmount}${noteText}${catText}${timeText}\n\nSilakan tinjau & setujui bersama pasangan di:\n👉 ${validationUrl}`;
    } else if (isImage) {
      replyMessage = `📸 Foto bukti pembayaran diterima!\n\nSudah dimasukkan ke antrean validasi CelenganKita.\nSilakan buka aplikasi untuk melengkapi nominal & menyetujui bersama:\n👉 ${validationUrl}`;
    } else {
      replyMessage = `📝 Pesan catatan diterima di antrean CelenganKita.\nSilakan tentukan nominal di:\n👉 ${validationUrl}`;
    }

    // Berikan respons yang langsung dapat dikirim ulang oleh gateway WhatsApp (Hermes/Fonnte/Wablas/Baileys)
    return NextResponse.json({
      status: isDuplicate ? "ignored" : "queued",
      message: isDuplicate ? "Notifikasi duplikat diabaikan." : "Berhasil masuk antrean validasi.",
      reply: replyMessage,
      validationId: inserted?.[0]?.id,
      parsed: {
        amount: parsedAmount,
        merchant: parsedMerchant,
        type: parsedType,
        source: sourceApp,
        suggestedCategoryId,
        transactionDate,
        matchedDateLabel,
        isImage,
      },
    });
  } catch (err: any) {
    console.error("WhatsApp Webhook Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada pemrosesan webhook WhatsApp." },
      { status: 500 }
    );
  }
}

