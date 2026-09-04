"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sha256 } from "@/lib/utils";
import crypto from "crypto";

function generateInviteCode(): string {
  // 8 Karakter acak alfanumerik huruf kapital tanpa karakter ambigu (0, O, 1, I)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createNewSpace(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    const rawSpaceName = (formData.get("spaceName") as string)?.trim();
    const rawNickname = (formData.get("nickname") as string)?.trim();

    if (!rawSpaceName) {
      return { error: "Nama Ruang Anggaran wajib diisi." };
    }

    const spaceName = rawSpaceName.slice(0, 100);
    const nickname = (rawNickname ? rawNickname.slice(0, 50) : "") || "Saya";

    // Generate Token Webhook awal untuk MacroDroid
    const rawWebhookToken = `ckp_live_${crypto.randomBytes(24).toString("hex")}`;
    const webhookTokenHash = await sha256(rawWebhookToken);
    const inviteCode = generateInviteCode();
    const spaceId = crypto.randomUUID();

    // 1. Buat Space baru
    const { error: spaceError } = await supabase.from("spaces").insert({
      id: spaceId,
      name: spaceName,
      currency: "IDR",
      invite_code: inviteCode,
      webhook_token_hash: webhookTokenHash,
    });

    if (spaceError) {
      console.error("Gagal membuat space:", spaceError);
      return { error: "Tidak dapat membuat ruang anggaran. Silakan coba lagi." };
    }

    // 2. Masukkan user sebagai owner di space_members
    const { error: memberError } = await supabase.from("space_members").insert({
      space_id: spaceId,
      user_id: user.id,
      role: "owner",
      nickname,
    });

    if (memberError) {
      console.error("Gagal mendaftarkan anggota owner:", memberError);
      return { error: "Gagal menghubungkan profil ke ruang anggaran." };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("Unexpected error in createNewSpace:", err);
    return { error: "Terjadi kesalahan sistem saat membuat ruang anggaran." };
  }
}

export async function joinExistingSpace(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    const rawInviteCode = (formData.get("inviteCode") as string)?.trim().toUpperCase();
    const rawNickname = (formData.get("nickname") as string)?.trim();

    if (!rawInviteCode || rawInviteCode.length !== 8) {
      return { error: "Kode undangan harus terdiri dari 8 karakter." };
    }

    const nickname = (rawNickname ? rawNickname.slice(0, 50) : "") || "Pasangan";

    // Panggil RPC SECURITY DEFINER join_space_by_code
    // Memverifikasi kode, mencegah enumerasi, dan atomic insert ke space_members
    const { data: result, error: rpcError } = await supabase.rpc("join_space_by_code", {
      _invite_code: rawInviteCode,
      _nickname: nickname,
    });

    if (rpcError) {
      console.error("RPC join_space_by_code error:", rpcError);
      return { error: "Kode undangan tidak valid atau kedaluwarsa." };
    }

    const status = (result as any)?.status;
    if (status === "success" || status === "already_member") {
      revalidatePath("/", "layout");
      redirect("/dashboard");
    }

    return { error: "Kode undangan tidak valid atau kedaluwarsa." };
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("Unexpected error in joinExistingSpace:", err);
    return { error: "Terjadi kesalahan sistem saat bergabung ke ruang pasangan." };
  }
}

/**
 * Rotasi Kunci Webhook MacroDroid (Instant Invalidation)
 * Menghasilkan token baru, menyimpan hash-nya di DB, dan mengembalikan token plaintext sekali untuk disalin user.
 */
export async function rotateWebhookKey(spaceId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Sesi telah berakhir, silakan login kembali." };
    }

    if (!spaceId) {
      return { error: "ID Ruang tidak valid." };
    }

    // Generate token baru berentropi tinggi
    const rawToken = `ckp_live_${crypto.randomBytes(24).toString("hex")}`;
    const newHash = await sha256(rawToken);

    // Update token hash via RPC SECURITY DEFINER
    const { error: rpcError } = await supabase.rpc("rotate_space_webhook_token", {
      _space_id: spaceId,
      _new_hash: newHash,
    });

    if (rpcError) {
      console.error("Gagal merotasi webhook key:", rpcError);
      return { error: "Gagal memperbarui kunci webhook. Pastikan Anda memiliki akses." };
    }

    revalidatePath("/space/settings");
    // Kembalikan token plaintext sekali saja kepada klien (tidak pernah disimpan plaintext di DB)
    return {
      success: true,
      token: rawToken,
    };
  } catch (err: any) {
    console.error("Unexpected error in rotateWebhookKey:", err);
    return { error: "Terjadi kesalahan sistem saat merotasi kunci webhook." };
  }
}
