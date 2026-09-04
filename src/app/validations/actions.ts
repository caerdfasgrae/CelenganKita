"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveValidation(
  validationId: string,
  categoryId: string,
  customAmount?: number,
  description?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    if (!validationId || !categoryId) {
      return { error: "Data validasi atau kategori tidak lengkap." };
    }

    // 1. Coba eksekusi melalui PostgreSQL RPC SECURITY DEFINER (Atomic Single Transaction)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "approve_pending_validation_atomic",
      {
        _validation_id: validationId,
        _category_id: categoryId,
        _custom_amount: customAmount && customAmount > 0 ? customAmount : null,
        _custom_description: description?.trim() || null,
      }
    );

    if (!rpcError && rpcResult) {
      if (rpcResult.status === "already_resolved") {
        return { error: rpcResult.message || "Notifikasi ini sudah diproses sebelumnya." };
      }
      if (rpcResult.status === "success") {
        revalidatePath("/dashboard");
        revalidatePath("/validations");
        revalidatePath("/transactions");
        return { success: true };
      }
    }

    // 2. Fallback Atomic Guard (jika RPC belum diaplikasikan di DB)
    // Atomic update status 'pending' -> 'approved' terlebih dahulu
    const { data: updatedItem, error: updateError } = await supabase
      .from("pending_validations")
      .update({
        status: "approved",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq("id", validationId)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("Gagal mengupdate status validasi:", updateError);
      return { error: "Tidak dapat memproses validasi. Silakan coba lagi." };
    }

    if (!updatedItem) {
      return { error: "Notifikasi ini sudah diproses atau dibatalkan sebelumnya." };
    }

    const finalAmount = customAmount || updatedItem.parsed_amount || 0;
    if (finalAmount <= 0) {
      // Revert status jika nominal invalid
      await supabase
        .from("pending_validations")
        .update({ status: "pending", resolved_at: null, resolved_by: null })
        .eq("id", validationId);
      return { error: "Nominal transaksi harus lebih dari Rp 0." };
    }

    const finalDescription =
      description?.trim() ||
      updatedItem.parsed_merchant ||
      `${updatedItem.source_app} - Notifikasi Otomatis`;

    // Buat catatan transaksi resmi
    const { error: txError } = await supabase.from("transactions").insert({
      space_id: updatedItem.space_id,
      user_id: user.id,
      category_id: categoryId,
      type: updatedItem.parsed_type,
      amount: finalAmount,
      description: finalDescription.slice(0, 255),
      source: "webhook",
      transaction_date: updatedItem.created_at,
    });

    if (txError) {
      console.error("Gagal mencatat transaksi dari validasi:", txError);
      // Revert status jika gagal mencatat transaksi
      await supabase
        .from("pending_validations")
        .update({ status: "pending", resolved_at: null, resolved_by: null })
        .eq("id", validationId);
      return { error: "Gagal mencatat transaksi resmi." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/validations");
    revalidatePath("/transactions");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in approveValidation:", err);
    return { error: "Terjadi kesalahan sistem saat menyetujui transaksi." };
  }
}

export async function rejectValidation(validationId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    if (!validationId) {
      return { error: "ID validasi tidak valid." };
    }

    // 1. Coba panggil RPC atomic reject
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "reject_pending_validation_atomic",
      { _validation_id: validationId }
    );

    if (!rpcError && rpcResult) {
      if (rpcResult.status === "already_resolved") {
        return { error: rpcResult.message || "Notifikasi ini sudah diproses sebelumnya." };
      }
      if (rpcResult.status === "success") {
        revalidatePath("/dashboard");
        revalidatePath("/validations");
        return { success: true };
      }
    }

    // 2. Fallback Atomic Guard
    const { data: updated, error: updateError } = await supabase
      .from("pending_validations")
      .update({
        status: "rejected",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq("id", validationId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Gagal menolak notifikasi:", updateError);
      return { error: "Tidak dapat memproses penolakan transaksi." };
    }

    if (!updated) {
      return { error: "Notifikasi ini sudah diproses sebelumnya." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/validations");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in rejectValidation:", err);
    return { error: "Terjadi kesalahan sistem saat menolak transaksi." };
  }
}
