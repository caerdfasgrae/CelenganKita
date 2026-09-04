import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.celengankita.app",
  appName: "CelenganKita",
  webDir: "public",
  server: {
    // Dual Platform: APK terhubung langsung ke URL produksi Vercel
    // Setiap pembaruan kode di Vercel langsung dinikmati pengguna APK tanpa perlu compile ulang
    url: "https://celengan-kita-two.vercel.app",
    cleartext: false,
  },
  android: {
    backgroundColor: "#FFFDF8",
    allowMixedContent: false,
    captureInput: true,
  },
};

export default config;
