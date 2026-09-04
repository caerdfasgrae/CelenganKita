import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBankNotification } from "@/lib/parser/bank-notification";
import { sha256 } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    // 1. Larang penggunaan token via URL Query Parameter (Perlindungan Data Privacy / SEC-002)
    if (request.nextUrl.searchParams.has("key")) {
      return NextResponse.json(
        {
          error:
            "Penggunaan kunci via URL query parameter dilarang demi privasi dan keamanan data. Harap sertakan header 'X-Celengan-Key'.",
        },
        { status: 400 }
      );
    }

    // 2. Ekstrak Webhook Secret Key dari Header secara ketat
    const authHeader = request.headers.get("authorization");
    const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const apiKey = request.headers.get("x-celengan-key")?.trim() || bearerKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Header 'X-Celengan-Key' atau 'Authorization: Bearer <token>' wajib disertakan." },
        { status: 401 }
      );
    }

    // Validasi format token minimal (ckp_live_...)
    if (!apiKey.startsWith("ckp_live_") || apiKey.length < 24) {
      return NextResponse.json(
        { error: "Format kunci API tidak valid." },
        { status: 401 }
      );
    }

    // 3. Batasi Ukuran Payload (Maksimal 32 KB / SEC-005)
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 32768) {
      return NextResponse.json(
        { error: "Ukuran payload melebihi batas maksimal (32 KB)." },
        { status: 413 }
      );
    }

    // 4. Baca dan Validasi Payload Notifikasi (sebelum query DB untuk efisiensi resource)
    let payload: { app?: string; text?: string; title?: string; package?: string; body?: string } = {};

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        payload = await request.json();
      } catch {
        return NextResponse.json(
          { error: "Format JSON payload tidak valid." },
          { status: 400 }
        );
      }
    } else {
      try {
        const formData = await request.formData();
        payload = {
          app: (formData.get("app") as string) || (formData.get("package") as string) || "",
          text: (formData.get("text") as string) || (formData.get("body") as string) || "",
          title: (formData.get("title") as string) || "",
        };
      } catch {
        return NextResponse.json(
          { error: "Gagal membaca body request." },
          { status: 400 }
        );
      }
    }

    const rawText = (payload.text || payload.title || payload.body || "").trim();
    const appName = (payload.app || payload.package || "").trim().slice(0, 100);

    if (!rawText) {
      return NextResponse.json(
        { error: "Isi teks notifikasi (text) tidak boleh kosong." },
        { status: 400 }
      );
    }

    // Batasi panjang teks notifikasi maksimal 1.000 karakter
    if (rawText.length > 1000) {
      return NextResponse.json(
        { error: "Panjang teks notifikasi melebihi batas maksimal (1000 karakter)." },
        { status: 400 }
      );
    }

    // 5. Hash API key dan cari Space terkait
    const hashedKey = await sha256(apiKey);
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

    // 6. Hitung Idempotency Hash (Anti-Duplikasi Berbasis Database / SEC-004)
    const dateHour = new Date().toISOString().slice(0, 13); // Format: YYYY-MM-DDTHH
    const idempotencyString = `${space.id}_${appName}_${rawText}_${dateHour}`;
    const idempotencyHash = await sha256(idempotencyString);

    // 7. Parse Data Finansial menggunakan Heuristik Regex Ringan
    const parsed = parseBankNotification(appName, rawText);

    // 8. Masukkan ke tabel pending_validations dengan penanganan konkurensi (conflict-aware)
    const { data: inserted, error: insertError } = await supabase
      .from("pending_validations")
      .upsert(
        {
          space_id: space.id,
          raw_text: rawText,
          source_app: parsed.sourceApp,
          parsed_amount: parsed.amount > 0 ? parsed.amount : null,
          parsed_type: parsed.type,
          parsed_merchant: parsed.merchant,
          status: "pending",
          idempotency_hash: idempotencyHash,
        },
        { onConflict: "idempotency_hash", ignoreDuplicates: true }
      )
      .select("id, created_at");

    // Jika baris tidak ter-insert karena conflict duplicate (idempotency key sudah ada di DB)
    if (!insertError && (!inserted || inserted.length === 0)) {
      return NextResponse.json({
        status: "ignored",
        message: "Notifikasi duplikat berhasil diabaikan.",
      });
    }

    // Tangkap kode PostgreSQL 23505 (unique_violation) jika terjadi race condition
    if (insertError) {
      if ((insertError as any).code === "23505") {
        return NextResponse.json({
          status: "ignored",
          message: "Notifikasi duplikat berhasil diabaikan.",
        });
      }

      console.error("Gagal menyimpan pending validation:", insertError);
      return NextResponse.json(
        { error: "Gagal memproses notifikasi ke antrean validasi." },
        { status: 500 }
      );
    }

    const newRecord = inserted[0];

    // 9. Berikan respons sukses
    return NextResponse.json({
      status: "queued",
      message: "Notifikasi berhasil masuk ke antrean validasi CelenganKita.",
      validationId: newRecord?.id,
      parsed: {
        app: parsed.sourceApp,
        amount: parsed.amount,
        type: parsed.type,
        merchant: parsed.merchant,
      },
    });
  } catch (err: any) {
    console.error("Webhook unexpected processing error:", err);
    // Sembunyikan pesan teknis internal (Error Sanitization / SEC-006)
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada pemrosesan webhook." },
      { status: 500 }
    );
  }
}
