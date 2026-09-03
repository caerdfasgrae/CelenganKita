import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBankNotification } from "@/lib/parser/bank-notification";
import { sha256 } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    // 1. Ekstrak Webhook Secret Key dari Header atau Query Param
    const apiKey =
      request.headers.get("x-celengan-key") ||
      request.nextUrl.searchParams.get("key");

    if (!apiKey) {
      return NextResponse.json(
        { error: "Header 'X-Celengan-Key' atau query parameter 'key' wajib disertakan." },
        { status: 401 }
      );
    }

    // 2. Hash API key dan cari Space terkait
    const hashedKey = await sha256(apiKey.trim());
    const supabase = createAdminClient();

    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id, name")
      .eq("webhook_token_hash", hashedKey)
      .single();

    if (spaceError || !space) {
      return NextResponse.json(
        { error: "Kunci API tidak valid atau Ruang Anggaran tidak ditemukan." },
        { status: 401 }
      );
    }

    // 3. Baca Payload Notifikasi
    let payload: { app?: string; text?: string; title?: string; timestamp?: any } = {};

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      // Fallback form data / urlencoded jika disetel dari Tasker
      const formData = await request.formData();
      payload = {
        app: (formData.get("app") as string) || (formData.get("package") as string) || "",
        text: (formData.get("text") as string) || (formData.get("body") as string) || "",
        title: (formData.get("title") as string) || "",
      };
    }

    const rawText = (payload.text || payload.title || "").trim();
    const appName = (payload.app || "").trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Isi teks notifikasi (text) tidak boleh kosong." },
        { status: 400 }
      );
    }

    // 4. Hitung Idempotency Hash untuk mencegah notifikasi berulang di Android
    // Hash dibuat per jam agar notifikasi dengan teks persis sama tidak tercatat ganda
    const dateHour = new Date().toISOString().slice(0, 13); // Format: YYYY-MM-DDTHH
    const idempotencyString = `${space.id}_${appName}_${rawText}_${dateHour}`;
    const idempotencyHash = await sha256(idempotencyString);

    // Cek apakah hash sudah ada di database
    const { data: existing } = await supabase
      .from("pending_validations")
      .select("id, status")
      .eq("idempotency_hash", idempotencyHash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        status: "ignored",
        message: "Notifikasi duplikat berhasil diabaikan.",
        id: existing.id,
      });
    }

    // 5. Parse Data Finansial menggunakan Heuristik Regex Ringan
    const parsed = parseBankNotification(appName, rawText);

    // 6. Masukkan ke tabel pending_validations (Antrean Validasi)
    const { data: inserted, error: insertError } = await supabase
      .from("pending_validations")
      .insert({
        space_id: space.id,
        raw_text: rawText,
        source_app: parsed.sourceApp,
        parsed_amount: parsed.amount > 0 ? parsed.amount : null,
        parsed_type: parsed.type,
        parsed_merchant: parsed.merchant,
        status: "pending",
        idempotency_hash: idempotencyHash,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Gagal menyimpan pending validation:", insertError);
      return NextResponse.json(
        { error: "Gagal menyimpan notifikasi ke antrean validasi." },
        { status: 500 }
      );
    }

    // 7. Berikan respons sukses
    return NextResponse.json({
      status: "queued",
      message: "Notifikasi berhasil masuk ke antrean validasi CelenganKita.",
      validationId: inserted.id,
      parsed: {
        app: parsed.sourceApp,
        amount: parsed.amount,
        type: parsed.type,
        merchant: parsed.merchant,
      },
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + err.message },
      { status: 500 }
    );
  }
}
