import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah Indonesia (contoh: Rp 50.000)
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ramah pengguna dalam zona waktu WIB (contoh: "4 Sep 2026, 08:23 WIB")
 */
export function formatTanggal(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date) + " WIB"
  );
}

/**
 * Menghasilkan string YYYY-MM-DDTHH:mm dalam zona waktu WIB (Asia/Jakarta)
 * untuk nilai default input <input type="datetime-local">
 */
export function getWIBDateTimeLocal(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Hash string menggunakan SHA-256 (kompatibel Node.js dan browser)
 */
export async function sha256(message: string): Promise<string> {
  // Gunakan Web Crypto API yang didukung di Node 18+ dan Modern Browser
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Pembersih string angka dari notifikasi bank (misal "150.000" atau "150,000.00" -> 150000)
 */
export function cleanCurrencyString(rawStr: string): number {
  if (!rawStr) return 0;
  // Hapus karakter non-angka kecuali koma dan titik
  let cleaned = rawStr.replace(/[^0-9.,]/g, "").trim();

  // Pola Indonesia: titik adalah ribuan, koma adalah desimal ("50.000,00")
  if (cleaned.includes(".") && cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(".")) {
    // Bisa "50.000" (ribuan) atau "50.5" (desimal)
    const parts = cleaned.split(".");
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      // Titik ribuan
      cleaned = cleaned.replace(/\./g, "");
    }
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      // Koma ribuan
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // Koma desimal
      cleaned = cleaned.replace(",", ".");
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
