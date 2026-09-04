"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createManualTransaction(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    const spaceId = (formData.get("spaceId") as string)?.trim();
    const categoryId = (formData.get("categoryId") as string)?.trim();
    const type = formData.get("type") as "income" | "expense";
    const amountStr = formData.get("amount") as string;
    const rawDescription = (formData.get("description") as string)?.trim() || "";
    const rawDate = (formData.get("transactionDate") as string)?.trim() || "";
    const source = (formData.get("source") as "manual" | "ocr") || "manual";

    // Validasi Space ID
    if (!spaceId) {
      return { error: "Ruang anggaran tidak valid." };
    }

    // Validasi Tipe Transaksi
    if (type !== "income" && type !== "expense") {
      return { error: "Tipe transaksi harus berupa pemasukan atau pengeluaran." };
    }

    // Validasi Nominal
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || !isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000) {
      return { error: "Nominal transaksi harus lebih besar dari Rp 0." };
    }

    // Validasi Kategori
    if (!categoryId) {
      return { error: "Silakan pilih kategori transaksi." };
    }

    // Batasi panjang deskripsi maksimal 255 karakter
    const description = rawDescription ? rawDescription.slice(0, 255) : "Transaksi tanpa catatan";

    // Pastikan zona waktu WIB (+07:00) disertakan secara eksplisit ke PostgreSQL
    const transactionDate = rawDate
      ? (rawDate.includes("Z") || rawDate.includes("+") ? rawDate : `${rawDate}:00+07:00`)
      : new Date().toISOString();

    const { error } = await supabase.from("transactions").insert({
      space_id: spaceId,
      user_id: user.id,
      category_id: categoryId,
      type,
      amount,
      description,
      transaction_date: transactionDate,
      source,
    });

    if (error) {
      console.error("Gagal membuat transaksi:", error);
      return { error: "Tidak dapat menyimpan transaksi. Pastikan data sudah benar." };
    }

    // Telemetri Riset Skripsi (Silent Ground Truth Recording di Latar Belakang)
    const rawText = formData.get("rawText") as string | null;
    if (source === "ocr" && rawText) {
      const spatialAmount = parseFloat(formData.get("spatialAmount") as string) || null;
      const spatialMerchant = (formData.get("spatialMerchant") as string) || null;
      const spatialLatencyMs = parseInt(formData.get("spatialLatencyMs") as string, 10) || 0;

      // Panggil LLM & catat komparasi ke tabel riset tanpa membebani pengalaman pengguna
      (async () => {
        try {
          const { parseReceiptWithLLM } = await import("@/lib/ocr/llm-parser");
          const llmRes = await parseReceiptWithLLM(rawText);

          await supabase.from("receipt_evaluations").insert({
            space_id: spaceId,
            user_id: user.id,
            raw_text: rawText,
            spatial_merchant: spatialMerchant,
            spatial_amount: spatialAmount,
            spatial_latency_ms: spatialLatencyMs,
            llm_merchant: llmRes.merchant,
            llm_amount: llmRes.amount,
            llm_latency_ms: llmRes.latencyMs,
            llm_status: llmRes.isAvailable ? "success" : (llmRes.reason || "disabled"),
            actual_merchant: description || "Tanpa Keterangan",
            actual_amount: amount,
          });
        } catch (telemetryErr) {
          // Failsafe mutlak: kegagalan telemetri tidak boleh mengganggu operasional pengguna
          console.debug("Silent telemetry notice:", telemetryErr);
        }
      })();
    }

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in createManualTransaction:", err);
    return { error: "Terjadi kesalahan sistem saat menyimpan transaksi." };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    if (!transactionId) {
      return { error: "ID transaksi tidak valid." };
    }

    // RLS memastikan hanya anggota space yang dapat menghapus
    const { error, count } = await supabase
      .from("transactions")
      .delete({ count: "exact" })
      .eq("id", transactionId);

    if (error) {
      console.error("Gagal menghapus transaksi:", error);
      return { error: "Tidak dapat menghapus transaksi." };
    }

    if (count === 0) {
      return { error: "Transaksi tidak ditemukan atau Anda tidak memiliki akses." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in deleteTransaction:", err);
    return { error: "Terjadi kesalahan sistem saat menghapus transaksi." };
  }
}

export async function createCustomCategory(
  spaceId: string,
  name: string,
  type: "income" | "expense"
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    const cleanName = name?.trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 50) {
      return { error: "Nama kategori harus antara 2 hingga 50 karakter." };
    }

    if (!spaceId) {
      return { error: "Ruang anggaran tidak valid." };
    }

    if (type !== "income" && type !== "expense") {
      return { error: "Tipe kategori harus berupa pemasukan atau pengeluaran." };
    }

    const color = type === "income" ? "#10B981" : "#EF4444";
    const icon = "tag";

    const { data, error } = await supabase
      .from("categories")
      .insert({
        space_id: spaceId,
        name: cleanName,
        type,
        icon,
        color,
        is_system: false,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Gagal membuat kategori baru:", error);
      return { error: "Gagal menyimpan kategori baru. Pastikan nama belum ada." };
    }

    revalidatePath("/transactions/new");
    revalidatePath("/transactions");
    revalidatePath("/space/settings");
    return { success: true, category: data };
  } catch (err: any) {
    console.error("Unexpected error in createCustomCategory:", err);
    return { error: "Terjadi kesalahan sistem saat membuat kategori." };
  }
}

export async function deleteCustomCategory(categoryId: string, spaceId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    if (!categoryId || !spaceId) {
      return { error: "Data kategori tidak valid." };
    }

    const { error, count } = await supabase
      .from("categories")
      .delete({ count: "exact" })
      .eq("id", categoryId)
      .eq("space_id", spaceId)
      .eq("is_system", false);

    if (error) {
      console.error("Gagal menghapus kategori:", error);
      return { error: "Tidak dapat menghapus kategori. Kategori mungkin masih digunakan oleh transaksi." };
    }

    if (count === 0) {
      return { error: "Kategori tidak ditemukan atau kategori bawaan sistem tidak dapat dihapus." };
    }

    revalidatePath("/transactions/new");
    revalidatePath("/transactions");
    revalidatePath("/space/settings");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in deleteCustomCategory:", err);
    return { error: "Terjadi kesalahan sistem saat menghapus kategori." };
  }
}

