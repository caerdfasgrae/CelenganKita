import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBankNotification } from "@/lib/parser/bank-notification";
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

    // Resolusi otomatis: Jika hanya ada 1 space di database (ruang kas bersama milik pengguna)
    if (!space) {
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

    // 3. Normalisasi Payload Pesan Masuk (Support Meta Cloud API, Fonnte, Wablas, Baileys, direct)
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
      // B. Indonesian Gateway format (Fonnte, Wablas, UltraMsg, Baileys, dll)
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

    // 4. Proses Ekstraksi Finansial
    let sourceApp = isImage ? "WhatsApp (Foto)" : "WhatsApp";
    let parsedAmount = 0;
    let parsedMerchant: string | null = null;
    let parsedType: "income" | "expense" = "expense";

    // Coba parse teks (baik SMS bank yang diforward, chat singkat "kopi 25rb", atau caption foto)
    const parsed = parseBankNotification("WhatsApp", rawText);
    if (parsed.success && parsed.amount > 0) {
      parsedAmount = parsed.amount;
      parsedMerchant = parsed.merchant;
      parsedType = parsed.type;
      if (!isImage && parsed.sourceApp !== "WhatsApp") {
        sourceApp = parsed.sourceApp;
      }
    }

    // 5. Hitung Idempotency Hash Anti-Duplikasi
    const dateHour = new Date().toISOString().slice(0, 13);
    const idempotencyString = `${space.id}_${sourceApp}_${rawText}_${dateHour}`;
    const idempotencyHash = await sha256(idempotencyString);

    // 6. HUMAN-IN-THE-LOOP: Selalu masukkan ke pending_validations (TIDAK langsung ke transactions)
    const { data: inserted, error: insertError } = await supabase
      .from("pending_validations")
      .upsert(
        {
          space_id: space.id,
          raw_text: isImage && mediaUrl ? `[Gambar: ${mediaUrl}] ${rawText}` : rawText,
          source_app: sourceApp,
          parsed_amount: parsedAmount > 0 ? parsedAmount : null,
          parsed_type: parsedType,
          parsed_merchant: parsedMerchant,
          status: "pending",
          idempotency_hash: idempotencyHash,
        },
        { onConflict: "idempotency_hash", ignoreDuplicates: true }
      )
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

    // 7. Susun Pesan Balasan WhatsApp Ramah & Informatif
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://celengan-kita-two.vercel.app";
    const validationUrl = `${siteUrl}/validations`;

    let replyMessage = "";
    if (isDuplicate) {
      replyMessage = `ℹ️ Pesan transaksi ini sudah pernah diterima sebelumnya dan ada di antrean validasi CelenganKita.`;
    } else if (parsedAmount > 0) {
      const formattedAmount = `Rp ${parsedAmount.toLocaleString("id-ID")}`;
      const merchantText = parsedMerchant ? ` di ${parsedMerchant}` : "";
      replyMessage = `🔔 Terdeteksi pengeluaran ${formattedAmount}${merchantText}.\n\nSudah dimasukkan ke antrean validasi CelenganKita!\nSilakan tinjau dan setujui bersama pasangan di:\n👉 ${validationUrl}`;
    } else if (isImage) {
      replyMessage = `📸 Foto bukti pembayaran diterima!\n\nSudah dimasukkan ke antrean validasi CelenganKita.\nSilakan buka aplikasi untuk melengkapi nominal & menyetujui:\n👉 ${validationUrl}`;
    } else {
      replyMessage = `📝 Pesan catatan diterima di antrean CelenganKita.\nSilakan tentukan nominal di:\n👉 ${validationUrl}`;
    }

    // Berikan respons yang langsung dapat dikirim ulang oleh gateway WhatsApp (Fonnte/Wablas/Baileys)
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
