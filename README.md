# CelenganKita 🐧💕🐧

**CelenganKita** adalah aplikasi manajemen anggaran dan pencatatan kas bersama (*shared couple budgeting*) yang dirancang khusus untuk pasangan di Indonesia. Didesain dengan estetika hangat (*Warm Cozy Couples Sanctuary*), berorientasi *mobile-first edge-to-edge*, bebas dari "AI slop", serta memiliki arsitektur berbiaya **Rp0 (Free Tier)** dengan waktu respon instan.

Tersedia sebagai **Progressive Web App (PWA)** dan **Aplikasi Android Native APK** (berbasis Capacitor dengan *Bank Notification Listener Service*).

---

## 🌟 Fitur Unggulan

1. **Ruang Celengan Khusus Berdua (Couple Space)**:
   - Terhubung bersama pasangan menggunakan **Kode Sambung 8 Karakter**.
   - Keamanan tingkat basis data via *PostgreSQL Row-Level Security (RLS)*: data belanjaan kalian berdua 100% terisolasi dan privat.
2. **Fitur "Catat Cepat" Satu Baris (Natural Language Input)**:
   - Cukup ketik kalimat santai seperti `Kopi susu 25rb` atau `Bensin 50k` di Dasbor.
   - Sistem mem-parsing nominal, deskripsi, dan mencocokkan kategori secara instan (0ms) di memori HP tanpa biaya komputasi API.
   - Dilengkapi lembar konfirmasi ramah jempol (*1-tap bottom sheet*).
3. **Visualisasi Kategori Pengeluaran Bersama (Spending Breakdown)**:
   - Grafik proporsi pengeluaran bulanan berdua yang rapi dan elegan.
   - Menampilkan persentase dan nominal belanja tiap kategori (*Makan & Minum, Transportasi, Belanja Bulanan, dll.*) agar transparansi keuangan terjaga tanpa saling curiga.
4. **Foto Nota & Struk Belanja (Client-Side OCR)**:
   - Pemindaian struk fisik 100% diproses di browser HP menggunakan Tesseract.js & *Spatial-Keyword Anchoring Heuristics*.
   - 0 detik beban komputasi server, menghemat kuota cloud dan menjamin privasi foto struk.
5. **Sinkronisasi Notifikasi HP Otomatis**:
   - Mendukung penangkapan notifikasi belanja dari **BCA Mobile, GoPay, ShopeePay, BRI (BRImo), BNI, dan SeaBank**.
   - Setiap transaksi otomatis masuk ke antrean *Tinjau Belanja* di dasbor (*Human-in-the-Loop*) sebelum resmi dibukukan ke saldo kas bersama.
6. **Ergonomi Layar Fisik & Tampilan Native**:
   - Tampilan penuh *full bleed edge-to-edge* tanpa sekat samping.
   - Penyesuaian safe area Android (*status bar, punch-hole camera, gesture navigation bar*).
   - Target sentuhan tombol nyaman ($\ge 44 \times 44\text{px}$) dengan umpan balik taktil.

---

## 🛠️ Arsitektur & Strategi Biaya Rp0

| Komponen | Pilihan Teknologi | Wilayah / Keunggulan |
| :--- | :--- | :--- |
| **Frontend & API** | Next.js 15 (App Router) di Vercel | Region Singapura (`sin1`) intra-datacenter proximity |
| **Basis Data** | Supabase (PostgreSQL 500MB Free Tier) | Region Singapura (`ap-southeast-1`), native RLS |
| **Mobile App** | Capacitor Android Native APK & PWA | Edge-to-edge WebView + Native Notification Service |
| **OCR Komputasi** | Tesseract.js di Web Worker Client | Rp0 biaya server, 100% di browser |
| **Identitas Visual** | Warm Cozy Couple Palette | `#FFFDF8` Canvas, `#FFA259` Apricot, `#FF7E7E` Coral |

---

## 📂 Struktur Repositori

```text
CelenganKita/
├── android/              # Proyek Native Android (Capacitor + Bank Notification Service)
├── public/               # Aset Statis & Maskot (Pingu & Penga)
├── src/
│   ├── app/
│   │   ├── api/v1/       # Endpoint Ping Warmup & Webhook Ingestion
│   │   ├── dashboard/    # Dasbor Saldo, Catat Cepat & Grafik Kategori
│   │   ├── space/        # Pengaturan Celengan, Pasangan & Kategori Kustom
│   │   ├── transactions/ # Riwayat Belanja, Filter & Form Input Lengkap
│   │   └── validations/  # Antrean Tinjau Belanja Notifikasi HP
│   ├── components/       # Komponen UI Ergonomis, Bottom Sheet & Navigasi
│   ├── lib/              # Parser Cerdas, OCR Heuristics & Supabase Clients
│   └── types/            # Definisi Tipe Data PostgreSQL
├── supabase/             # Skema Migrasi DDL & Kebijakan Keamanan RLS
└── docs/                 # Panduan Teknis Android & Riset Akademis
```

---

## 🚦 Menjalankan Proyek Secara Lokal

### 1. Prasyarat Lingkungan
* Node.js 20+
* Akun Supabase (Free Tier)

### 2. Konfigurasi Kredensial
Salin `.env.example` menjadi `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Instalasi & Eksekusi
```bash
npm install
npm run dev
```
Buka `http://localhost:3000` di peramban.

### 4. Menjalankan Build Produksi & Typecheck
```bash
npx tsc --noEmit
npm run build
```

---

## 📱 Membangun Aplikasi Android APK (Capacitor)

Proyek ini telah dikonfigurasi dengan Capacitor Android untuk menghasilkan berkas APK:
```bash
npm run build
npx cap sync android
```
Buka folder `android` menggunakan **Android Studio** untuk menghasilkan build Debug atau Release APK (`.apk`).
Panduan lengkap dapat dibaca di [`docs/ANDROID_APK_GUIDE.md`](docs/ANDROID_APK_GUIDE.md).

---

## 🔒 Privasi & Keamanan Data Pasangan

* **Isolasi Penuh**: Menggunakan arsitektur multi-tenant berbasis `space_id` dengan Row-Level Security (RLS) PostgreSQL. Pengguna tidak dapat melihat data pasangan lain.
* **Human-in-the-Loop**: Notifikasi transaksi dari ponsel tidak langsung mengubah saldo sebelum disetujui bersama di menu *Tinjau*.
* **Zero Secret Leakage**: Kredensial service-role hanya berjalan di sisi server Next.js.
