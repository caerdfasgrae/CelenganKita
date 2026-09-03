"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createManualTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir, silakan login kembali." };
  }

  const spaceId = formData.get("spaceId") as string;
  const categoryId = formData.get("categoryId") as string;
  const type = formData.get("type") as "income" | "expense";
  const amountStr = formData.get("amount") as string;
  const description = formData.get("description") as string;
  const transactionDate = (formData.get("transactionDate") as string) || new Date().toISOString();
  const source = (formData.get("source") as "manual" | "ocr") || "manual";

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Nominal transaksi harus lebih besar dari 0." };
  }

  if (!categoryId) {
    return { error: "Silakan pilih kategori transaksi." };
  }

  const { error } = await supabase.from("transactions").insert({
    space_id: spaceId,
    user_id: user.id,
    category_id: categoryId,
    type,
    amount,
    description: description || "Transaksi tanpa catatan",
    transaction_date: transactionDate,
    source,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir." };
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}
