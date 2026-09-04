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
