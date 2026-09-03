"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveValidation(
  validationId: string,
  categoryId: string,
  customAmount?: number,
  description?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir, silakan login kembali." };
  }

  // 1. Ambil data pending validation
  const { data: item, error: fetchError } = await supabase
    .from("pending_validations")
    .select("*")
    .eq("id", validationId)
    .single();

  if (fetchError || !item) {
    return { error: "Data antrean tidak ditemukan." };
  }

  const finalAmount = customAmount || item.parsed_amount || 0;
  if (finalAmount <= 0) {
    return { error: "Nominal transaksi harus lebih dari 0." };
  }

  // 2. Buat transaksi resmi di tabel transactions
  const { error: txError } = await supabase.from("transactions").insert({
    space_id: item.space_id,
    user_id: user.id,
    category_id: categoryId,
    type: item.parsed_type,
    amount: finalAmount,
    description: description || item.parsed_merchant || `${item.source_app} - Notifikasi Otomatis`,
    source: "webhook",
    transaction_date: item.created_at,
  });

  if (txError) {
    return { error: txError.message };
  }

  // 3. Update status antrean menjadi approved
  const { error: updateError } = await supabase
    .from("pending_validations")
    .update({
      status: "approved",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", validationId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/validations");
  return { success: true };
}

export async function rejectValidation(validationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir." };
  }

  const { error } = await supabase
    .from("pending_validations")
    .update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", validationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/validations");
  return { success: true };
}
