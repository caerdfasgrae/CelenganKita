# CelenganKita 🐷❤️

**CelenganKita** adalah aplikasi manajemen anggaran bersama (*shared budgeting*) yang dirancang khusus untuk pasangan cerdas di Indonesia. Dibangun berbasis Progressive Web App (PWA) yang dapat di-install langsung di layar utama smartphone tanpa biaya store listing, dengan arsitektur cloud hemat biaya (**Target Rp0 / Free Tier**).

---

## 🚀 Fitur Unggulan

1. **Ruang Dompet Bersama (Couple Space)**:
   - Pasangan terhubung dalam satu *Space* menggunakan **Kode Undangan 8 Karakter**.
   - Row-Level Security (RLS) di level PostgreSQL memastikan data hanya bisa diakses oleh Anda dan pasangan tercinta.
2. **Sinkronisasi Otomatis Notifikasi HP (Fitur 1)**:
   - Integrasi gratis dengan aplikasi otomatisasi Android (MacroDroid / Tasker).
   - Menangkap notifikasi push dari **BCA Mobile, GoPay, ShopeePay, BRI (BRImo), BNI, dan SeaBank**.
   - Masuk ke antrean *"Perlu Validasi"* di dasbor sebelum tercatat secara resmi (human-in-the-loop).
3. **Scan Struk Belanja & Bukti Transfer OCR (Fitur 2)**:
   - Pemrosesan gambar 100% di browser pengguna (*client-side*) menggunakan **Tesseract.js** & Canvas Binarization.
   - **0 detik pemakaian vCPU di Google Cloud Run**, menghemat kuota server dan bandwidth.
   - Mendukung **Foto Langsung dari Kamera** maupun **Pilih Screenshot dari Galeri HP**.
4. **PWA Offline & Mobile-First**:
   - Web App Manifest & Service Worker untuk pengalaman fullscreen menyerupai aplikasi native Android/iOS.

---

## 🛠️ Tech Stack & Strategi Biaya Rp0

| Komponen | Pilihan Teknologi | Keunggulan & Efisiensi |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router, Standalone) | Server Components cepat & Route Handlers untuk Webhook API |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Desain responsif mobile-first, ramah sentuhan, zero-runtime CSS |
| **Database** | Supabase (PostgreSQL 500MB Free Tier) | Row-Level Security (RLS) native tanpa beban ORM binary |
| **Client Lib** | `@supabase/ssr` + Generated Types | Memori hemat 50–100MB RAM dibanding Prisma, cold-start cepat |
| **OCR Engine** | Tesseract.js di Web Worker | 0 biaya server komputasi |
| **Komputasi** | Google Cloud Run (Region `us-central1`) | Always Free Tier (2 juta req/bln, 360k GB-sec, 180k vCPU-sec) |
| **Edge CDN** | Cloudflare Free Plan | Memangkas latensi US-ID dari ~250ms ke <25ms via caching edge Jakarta |

---

## 📂 Struktur Proyek

```
CelenganKita/
├── public/
│   ├── icons/            # Icon PWA (SVG, 192x192, 512x512)
│   ├── manifest.json     # PWA Manifest
│   └── sw.js             # Service Worker Cache
├── scripts/
│   ├── create-png-icons.mjs  # Generator Icon PNG PWA
│   └── test-parser.mjs       # Unit Test Regex Notifikasi Bank
├── src/
│   ├── app/
│   │   ├── api/v1/webhook/notify/route.ts  # Webhook Ingestion API
│   │   ├── auth/actions.ts                 # Server Actions Auth
│   │   ├── dashboard/page.tsx              # Dasbor Utama Saldo Bersama
│   │   ├── login/page.tsx                  # Halaman Masuk
│   │   ├── register/page.tsx               # Halaman Daftar
│   │   ├── space/
│   │   │   ├── actions.ts                  # Server Actions Space & Invite
│   │   │   ├── setup/page.tsx              # Onboarding Buat / Gabung Space
│   │   │   └── settings/page.tsx           # Setup Webhook MacroDroid & Invite Code
│   │   ├── transactions/
│   │   │   ├── actions.ts                  # Server Actions Transaksi
│   │   │   ├── new/page.tsx                # Form Transaksi & OCR Scanner
│   │   │   └── page.tsx                    # Riwayat Transaksi & Filter
│   │   ├── validations/
│   │   │   ├── actions.ts                  # Server Actions Validasi
│   │   │   └── page.tsx                    # Antrean Validasi Notifikasi HP
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                        # Landing Page
│   ├── components/
│   │   ├── bottom-nav.tsx                  # Navigasi Bawah Mobile
│   │   ├── ocr-scanner.tsx                 # Client-side OCR Tesseract Scanner
│   │   └── pwa-register.tsx                # Service Worker Registrasi
│   ├── lib/
│   │   ├── parser/bank-notification.ts     # Regex Parser 6 Bank & E-Wallet
│   │   ├── supabase/                       # Supabase Client (Browser, Server, Admin)
│   │   └── utils.ts                        # Currency Format (IDR), Date, SHA256
│   ├── types/database.ts                   # TypeScript Interfaces Database
│   └── middleware.ts                       # Next.js Session Middleware
├── supabase/
│   └── schema.sql        # Skema DDL Database + RLS Policies Lengkap
├── Dockerfile            # Multi-stage Dockerfile untuk Cloud Run
└── package.json
```

---

## 🚦 Panduan Menjalankan Proyek

### 1. Setup Supabase
1. Buat proyek baru di [supabase.com](https://supabase.com) (Free Tier).
2. Buka tab **SQL Editor**, salin dan jalankan seluruh isi file `supabase/schema.sql`.
3. Buka **Project Settings &rarr; API**, salin `Project URL`, `anon public key`, dan `service_role key`.
4. Buat file `.env.local` di root proyek:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

### 2. Menjalankan di Komputer Lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:3000` di browser.

### 3. Menguji Parser Notifikasi Bank
```bash
node scripts/test-parser.mjs
```

---

## 📱 Panduan Setup MacroDroid (Android)

1. Unduh aplikasi **MacroDroid** dari Google Play Store (versi gratis sudah mencukupi).
2. Tambahkan Macro baru:
   - **Trigger**: `Device Events` &rarr; `Notification` &rarr; `Notification Received` &rarr; Pilih aplikasi: **BCA, GoPay, ShopeePay, BRImo, BNI, atau SeaBank**.
   - **Action**: `Connectivity` &rarr; `HTTP Request`:
     - Method: `POST`
     - URL: `https://[DOMAIN_ANDA]/api/v1/webhook/notify`
     - Headers:
       - `Content-Type`: `application/json`
       - `X-Celengan-Key`: `[KODE_UNDANGAN_SPACE]`
     - Request Body (JSON):
       ```json
       {
         "app": "{notification_package_name}",
         "title": "{notification_title}",
         "text": "{notification_text}"
       }
       ```
3. Begitu Anda melakukan transaksi di HP, notifikasi akan langsung terkirim ke CelenganKita dan muncul di menu **Validasi**!

---

## ☁️ Deployment ke Google Cloud Run (Target Rp0)

1. Build & Push Image Container ke Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT_ID]/celengan-kita:latest
   ```
2. Deploy ke Cloud Run Region `us-central1` (Eligible Always Free Tier):
   ```bash
   gcloud run deploy celengan-kita \
     --image gcr.io/[PROJECT_ID]/celengan-kita:latest \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --min-instances 0 \
     --max-instances 1 \
     --memory 512Mi \
     --cpu 1 \
     --set-env-vars NEXT_PUBLIC_SUPABASE_URL="...",NEXT_PUBLIC_SUPABASE_ANON_KEY="...",SUPABASE_SERVICE_ROLE_KEY="..."
   ```
3. Hubungkan Custom Domain melalui **Cloudflare Free Plan** (DNS Proxy Orange Cloud) untuk proteksi latensi dan caching gratis aset statis.
