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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir, silakan login kembali." };
  }

  const spaceName = formData.get("spaceName") as string;
  const nickname = formData.get("nickname") as string;

  if (!spaceName) {
    return { error: "Nama Ruang Anggaran wajib diisi." };
  }

  // Generate Token Webhook acak untuk MacroDroid
  const rawWebhookToken = `ckp_live_${crypto.randomBytes(24).toString("hex")}`;
  const webhookTokenHash = await sha256(rawWebhookToken);
  const inviteCode = generateInviteCode();

  // 1. Buat Space baru
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .insert({
      name: spaceName,
      currency: "IDR",
      invite_code: inviteCode,
      webhook_token_hash: webhookTokenHash,
    })
    .select("id")
    .single();

  if (spaceError || !space) {
    return { error: spaceError?.message || "Gagal membuat ruang anggaran." };
  }

  // 2. Masukkan user sebagai owner di space_members
  const { error: memberError } = await supabase.from("space_members").insert({
    space_id: space.id,
    user_id: user.id,
    role: "owner",
    nickname: nickname || "Saya",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function joinExistingSpace(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi telah berakhir, silakan login kembali." };
  }

  const inviteCode = (formData.get("inviteCode") as string)?.trim().toUpperCase();
  const nickname = formData.get("nickname") as string;

  if (!inviteCode || inviteCode.length !== 8) {
    return { error: "Kode undangan harus terdiri dari 8 karakter." };
  }

  // 1. Cari Space berdasarkan invite_code
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .single();

  if (spaceError || !space) {
    return { error: "Kode undangan tidak ditemukan. Pastikan kodenya benar." };
  }

  // 2. Cek apakah sudah bergabung
  const { data: existingMember } = await supabase
    .from("space_members")
    .select("id")
    .eq("space_id", space.id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    redirect("/dashboard");
  }

  // 3. Masukkan sebagai partner
  const { error: joinError } = await supabase.from("space_members").insert({
    space_id: space.id,
    user_id: user.id,
    role: "partner",
    nickname: nickname || "Pasangan",
  });

  if (joinError) {
    return { error: joinError.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
