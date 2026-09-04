# Panduan Android APK & Dual Platform — CelenganKita

Dokumen ini menjelaskan arsitektur dan langkah kompilasi **CelenganKita Versi Android APK** yang berdampingan secara harmonis dengan **Versi Website (PWA)** di Vercel.

---

## 1. Arsitektur Dual Platform (Website & APK)

CelenganKita dirancang menggunakan arsitektur **Single Source of Truth**:
- **Versi Website (PWA)**: Live di `https://celengan-kita-two.vercel.app`. Dapat dibuka di peramban apa saja (Desktop, iPhone/iOS, Android), sangat hemat memori, dan dapat diinstal ke Home Screen.
- **Versi Android APK**: Dibungkus menggunakan **Capacitor** dengan native wrapper Android (`com.celengankita.app`).
  - **Live Sync**: APK memuat antarmuka web dari Vercel via WebView yang aman. Setiap perbaikan bug atau perubahan UI di GitHub/Vercel langsung aktif di APK tanpa perlu compile ulang!
  - **Native Superpowers**: APK memiliki akses ke sistem operasi Android, khususnya `NotificationListenerService` untuk menangkap notifikasi mutasi rekening m-banking tanpa memerlukan aplikasi pihak ketiga seperti MacroDroid.

---

## 2. Fitur Otomasi Notifikasi: Human-in-the-Loop

Sesuai aturan keamanan perbankan dan invarian produk:
> **Aplikasi TIDAK PERNAH mencatat transaksi langsung ke pembukuan tanpa persetujuan pengguna.**

Alur kerja di Android APK:
1. Pengguna melakukan pembayaran melalui BCA Mobile, Livin Mandiri, GoPay, ShopeePay, BRImo, SeaBank, atau DANA.
2. `BankNotificationListenerService` di latar belakang mendeteksi notifikasi mutasi.
3. APK memunculkan notifikasi interaktif lokal di status bar HP:
   ```text
   ┌────────────────────────────────────────────────────────┐
   │ 🐷 CelenganKita                                         │
   │ Terdeteksi pembayaran Rp 45.000 di Kopi Kenangan,      │
   │ masukkan ke celengan?                                  │
   │                                                        │
   │ [Ya, Masukkan]                [Abaikan]                │
   └────────────────────────────────────────────────────────┘
   ```
4. **Pilihan Pengguna**:
   - Jika menekan **[Ya, Masukkan]**: Transaksi diteruskan ke antrean `pending_validations` untuk diverifikasi bersama pasangan.
   - Jika menekan **[Abaikan]**: Notifikasi ditutup tanpa efek samping apa pun.
   - Jika mengetuk badan notifikasi: Aplikasi CelenganKita langsung terbuka ke menu **Tinjau** (`/validations`).

---

## 3. Cara Meng-compile File APK

### Prasyarat:
- Pastikan Android SDK atau [Android Studio](https://developer.android.com/studio) terinstal di komputer.
- Pastikan Java JDK (versi 17 atau 21) terpasang.

### Opsi A: Compile Cepat via Command Line (Terminal)
Di root repositori project, jalankan:
```bash
# Masuk ke folder android
cd android

# Buat file APK Debug (tidak perlu signing key)
./gradlew assembleDebug

# Untuk pengguna Windows PowerShell:
.\gradlew.bat assembleDebug
```
File APK hasil build akan berada di:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Opsi B: Buka di Android Studio
Di terminal root project, cukup jalankan:
```bash
npx cap open android
```
Android Studio akan terbuka otomatis. Anda cukup menekan tombol **Run (Play ▶️)** untuk memasang langsung ke HP yang terhubung via kabel USB / WiFi debugging, atau pilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 4. Cara Mengaktifkan Akses Notifikasi di HP

Setelah menginstal file APK di HP Android:
1. Buka aplikasi **CelenganKita**.
2. Masuk ke **Pengaturan HP (Settings)** > **Aplikasi** > **Akses Khusus (Special App Access)** > **Akses Notifikasi (Notification Access)**.
3. Cari **CelenganKita Pembaca Transaksi** dan aktifkan toggle ke posisi **ON**.
4. Selesai! Mulai saat ini, setiap pembayaran m-banking akan memunculkan prompt konfirmasi *Human-in-the-Loop*.
