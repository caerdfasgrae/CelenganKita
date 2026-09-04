# Software Requirements Specification (SRS) — CelenganKita

**Document Version:** 1.0.0  
**Status:** Active Technical Baseline / Single Source of Truth  
**Architecture:** Fullstack Next.js (App Router) + Supabase Managed PostgreSQL + PWA  
**Runtime Target:** Google Cloud Run (Containerized Node.js 20 Alpine Standalone)  

---

## 1. System Overview

Sistem CelenganKita terdiri dari tiga jalur interaksi data utama yang bekerja secara harmonis:

### 1.1 Jalur Aplikasi Pengguna (Interactive User Path)
```text
[ Browser / PWA Client ]
       │
       ▼ (HTTPS / Session Cookie)
[ Next.js Middleware (Session Validation & Route Protection) ]
       │
       ▼
[ Server Components / Server Actions (src/app/*) ]
       │
       ▼ (Scoped User Client - `@supabase/ssr`)
[ Supabase PostgreSQL Data Layer ]
       │
       ▼
[ Row-Level Security (RLS) & PostgreSQL Constraints ]
```

### 1.2 Jalur Otomasi Webhook Eksternal (Automated Ingestion Path)
```text
[ Android Device (MacroDroid / Tasker) ]
       │
       ▼ (HTTPS POST / Header: X-Celengan-Key / Max 32KB)
[ Route Handler: /api/v1/webhook/notify ]
       │
       ├─► 1. Verifikasi Header & Hash Token (SHA-256)
       ├─► 2. Hitung Idempotency Key (SHA-256)
       ├─► 3. Heuristic Regex Parsing (6 Bank / E-Wallet)
       │
       ▼ (Privileged Admin Client - `createAdminClient`)
[ Supabase Table: public.pending_validations ]
       │
       ▼ (PostgreSQL UNIQUE Constraint: idempotency_hash)
[ Antrean Validasi di Dasbor Pengguna ]
```

### 1.3 Jalur Pemrosesan OCR Struk Belanja (Client-Side Worker Path)
```text
[ Kamera HP / Galeri Berkas ]
       │
       ▼ (Local File Blob)
[ HTML5 Canvas Pre-processing (Grayscale & Contrast Boost) ]
       │
       ▼ (Processed Image DataURL)
[ Tesseract.js Web Worker (In-Browser OCR Engine) ]
       │
       ▼ (Extracted Text)
[ Local Regex Extractor (Total Amount & Store Name) ]
       │
       ▼
[ Form Transaksi Klien (Review & Konfirmasi Manual oleh Pengguna) ]
```

---

## 2. Architecture & Layer Responsibilities

CelenganKita mengadopsi pola arsitektur **Next.js Fullstack Monorepo Standalone**:

| Lapisan Arsitektur | Komponen / Direktori | Tanggung Jawab Utama |
|---|---|---|
| **Presentation & UI** | `src/components/*`, `src/app/**/page.tsx` | Rendering antarmuka mobile-first, menangani state UI lokal, feedback form, dan interaksi sentuh. |
| **Routing & Auth Guard** | `src/middleware.ts`, `src/lib/supabase/middleware.ts` | Validasi token sesi Supabase Auth, perlindungan rute privat (`/dashboard`, `/transactions`, `/space`, `/validations`), pengalihan otomatis login/dashboard. |
| **Application Logic** | `src/app/**/actions.ts` | Server Actions untuk mutasi data (pembuatan space, join space, insert transaksi manual, approve/reject validasi). Memvalidasi input sebelum memanggil database. |
| **Ingestion API** | `src/app/api/v1/webhook/notify/route.ts` | Endpoint stateless HTTP untuk menerima notifikasi eksternal, validasi keamanan payload, sanitasi, dan deduplikasi. |
| **Domain Utilities** | `src/lib/parser/*`, `src/lib/utils.ts` | Heuristik parsing perbankan Indonesia, format mata uang IDR (`cleanCurrencyString`, `formatIDR`), komputasi kriptografi SHA-256. |
| **Data Access Layer** | `src/lib/supabase/*` | Inisialisasi client Supabase: Scoped User Client (`server.ts`, `client.ts`) untuk interaksi pengguna berbasis RLS, dan Admin Client (`admin.ts`) khusus server webhook. |
| **Persistence & Rules** | `supabase/schema.sql`, PostgreSQL RPC | Menegakkan integritas relasional, foreign key cascades, unique constraints, RLS policies, dan stored procedures atomic `SECURITY DEFINER`. |

---

## 3. Technology Stack

| Lapisan | Teknologi | Versi Aktual | Tujuan / Peruntukan | Status |
|---|---|---|---|---|
| **Framework** | Next.js (App Router) | `15.1.7` | Framework fullstack React, Server Components, Route Handlers, Standalone deployment | `IMPLEMENTED` |
| **UI Library** | React & React DOM | `19.0.0` | Deklarasi antarmuka komponen, hook transisi (`useTransition`, `useActionState`) | `IMPLEMENTED` |
| **Language** | TypeScript | `5.7.3` | Type safety end-to-end dari skema database hingga komponen UI | `IMPLEMENTED` |
| **Styling** | Tailwind CSS | `3.4.17` | Utility-first styling mobile-first, zero-runtime CSS | `IMPLEMENTED` |
| **Icons** | Lucide React | `0.475.0` | Ikonografi antarmuka finansial yang konsisten | `IMPLEMENTED` |
| **Database** | PostgreSQL (Supabase) | `v15+` (Managed) | Penyimpanan relasional, RLS native, trigger, dan RPC stored procedures | `IMPLEMENTED` |
| **DB Client** | `@supabase/ssr`, `@supabase/supabase-js` | `0.5.2` / `2.49.1` | Komunikasi aman dengan Supabase berbasis cookie HTTP-only | `IMPLEMENTED` |
| **OCR Engine** | Tesseract.js | `6.0.0` | OCR lokal di Web Worker browser tanpa beban server | `IMPLEMENTED` |
| **Container** | Docker Alpine Multi-stage | Node 20 | Packaging kontainer minimalis (`output: "standalone"`) untuk Google Cloud Run | `IMPLEMENTED` |
| **PWA** | Web App Manifest & Service Worker | Standard W3C | Pengalaman aplikasi layar penuh, installable, caching aset statis dasar | `IMPLEMENTED` |
| **Cloud CDN** | Cloudflare Free Proxy | Managed | Proteksi DDoS, caching edge Jakarta, terminasi TLS | `PLANNED` |
| **Compute Cloud**| Google Cloud Run | Managed Serverless | Hosting kontainer Docker (Region `us-central1` Free Tier) | `PLANNED` |

---

## 4. Repository Architecture

```text
c:\Users\SMI-CPU014\Documents\Abyan\CelenganKita\
├── public/                                 # Aset statis publik & PWA
│   ├── icons/                              # Icon PWA maskable (192x192, 512x512, SVG)
│   ├── manifest.json                       # Konfigurasi PWA W3C
│   └── sw.js                               # Service Worker Caching (Static Assets Only)
├── scripts/                                # Skrip pemeliharaan & pengujian mandiri
│   ├── create-png-icons.mjs                # Skrip pembuat icon PNG dari SVG
│   ├── test-parser.mjs                     # Test suite parser regex bank/e-wallet
│   └── test-webhook-security.mjs           # Test suite verifikasi keamanan endpoint webhook
├── src/
│   ├── app/                                # Next.js App Router (Halaman & Tindakan)
│   │   ├── api/v1/webhook/notify/route.ts  # Webhook Ingestion Route Handler
│   │   ├── auth/actions.ts                 # Server Actions: Login, Register, Logout
│   │   ├── dashboard/page.tsx              # Halaman Dasbor Utama (Ringkasan Saldo & Mutasi)
│   │   ├── login/page.tsx                  # Halaman Autentikasi Masuk
│   │   ├── register/page.tsx               # Halaman Autentikasi Daftar Akun
│   │   ├── space/
│   │   │   ├── actions.ts                  # Server Actions: createNewSpace, joinExistingSpace, rotateWebhookKey
│   │   │   ├── setup/page.tsx              # Onboarding: Pilihan Buat atau Gabung Space
│   │   │   └── settings/
│   │   │       ├── page.tsx                # Halaman Konfigurasi Ruang Anggaran
│   │   │       └── settings-view.tsx       # Tampilan Pasangan, Kode Undangan, & Setup Webhook
│   │   ├── transactions/
│   │   │   ├── actions.ts                  # Server Actions: createManualTransaction, deleteTransaction
│   │   │   ├── new/
│   │   │   │   ├── page.tsx                # Halaman Form Catat Transaksi
│   │   │   │   └── transaction-form.tsx    # Komponen Form Transaksi & OCR Toggle
│   │   │   ├── transaction-history-view.tsx# Tampilan Riwayat & Filter Kategori/Tipe
│   │   │   └── page.tsx                    # Halaman Induk Riwayat Transaksi
│   │   ├── validations/
│   │   │   ├── actions.ts                  # Server Actions: approveValidation, rejectValidation
│   │   │   ├── validation-item.tsx         # Kartu Item Notifikasi Pending & Form Edit
│   │   │   └── page.tsx                    # Halaman Antrean Validasi Notifikasi
│   │   ├── globals.css                     # Gaya dasar Tailwind & token tema
│   │   ├── layout.tsx                      # Root Layout (PWA Register & Viewport Safe-area)
│   │   └── page.tsx                        # Landing Page Publik CelenganKita
│   ├── components/                         # Komponen Reusable Klien & Server
│   │   ├── ui/                             # Desain Sistem Dasar
│   │   │   ├── button.tsx                  # Tombol standar dengan varian & ukuran
│   │   │   ├── confirm-modal.tsx           # Modal konfirmasi tindakan destruktif
│   │   │   ├── currency-input.tsx          # Input mata uang format IDR interaktif
│   │   │   └── input.tsx                   # Input teks/angka standar dengan label terikat
│   │   ├── bottom-nav.tsx                  # Bilah Navigasi Bawah Mobile (Sticky Bottom)
│   │   ├── ocr-scanner.tsx                 # Modul OCR Tesseract.js & Canvas Preprocessing
│   │   └── pwa-register.tsx                # Registrasi Service Worker di Sisi Klien
│   ├── lib/                                # Utilitas & Konfigurasi Eksternal
│   │   ├── parser/
│   │   │   └── bank-notification.ts        # Modul Parsing Regex 6 Bank & E-Wallet
│   │   ├── supabase/
│   │   │   ├── admin.ts                    # Client Service-Role Privileged (Server Only)
│   │   │   ├── client.ts                   # Client Browser Autentikasi
│   │   │   ├── middleware.ts               # Handler Sesi Supabase di Edge/Middleware
│   │   │   └── server.ts                   # Client Server Component / Action berbasis Cookie
│   │   └── utils.ts                        # Parser Rupiah, Format Tanggal WIB, SHA-256
│   ├── types/
│   │   └── database.ts                     # TypeScript Interface Skema Basis Data
│   └── middleware.ts                       # Next.js Middleware Matcher Entrypoint
├── supabase/
│   ├── migrations/                         # Berkas Migrasi SQL Terkelola
│   │   ├── 20260903000000_init_celengan_schema.sql  # DDL Skema Inisial
│   │   └── 20260904000000_harden_security_and_rpc.sql# Migrasi Pengerasan Keamanan & RPC Atomic
│   └── schema.sql                          # Skema Lengkap Gabungan (Single SQL Source)
├── Dockerfile                              # Multi-stage Dockerfile untuk Cloud Run
├── next.config.ts                          # Konfigurasi Next.js Standalone Output
├── package.json                            # Dependensi Proyek & Skrip npm
├── tailwind.config.ts                      # Konfigurasi Tema Tailwind CSS
└── tsconfig.json                           # Konfigurasi Kompiler TypeScript
```

---

## 5. Data Architecture & Data Dictionary

Basis data diimplementasikan menggunakan PostgreSQL terkelola Supabase dengan 6 tabel utama:

### 5.1 Tabel `public.profiles`
Sinkronisasi satu-ke-satu dengan tabel internal `auth.users` Supabase melalui database trigger `handle_new_user`.
- `id` (UUID, Primary Key, Foreign Key &rarr; `auth.users(id)` ON DELETE CASCADE)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT, NULLABLE)
- `avatar_url` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`)

### 5.2 Tabel `public.spaces`
Entitas ruang anggaran bersama pasangan.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `name` (TEXT, NOT NULL): Nama ruang dompet.
- `currency` (VARCHAR(5), DEFAULT `'IDR'`, NOT NULL).
- `invite_code` (VARCHAR(8), UNIQUE, NOT NULL): Kode alfanumerik 8 karakter acak non-ambigu untuk mengundang pasangan.
- `webhook_token_hash` (TEXT, UNIQUE, NOT NULL): Nilai SHA-256 hash dari kunci API webhook MacroDroid (`ckp_live_...`).
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`)

### 5.3 Tabel `public.space_members`
Relasi banyak-ke-banyak antara profil pengguna dan ruang anggaran.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `space_id` (UUID, NOT NULL, Foreign Key &rarr; `public.spaces(id)` ON DELETE CASCADE)
- `user_id` (UUID, NOT NULL, Foreign Key &rarr; `public.profiles(id)` ON DELETE CASCADE)
- `role` (VARCHAR(20), DEFAULT `'member'`, NOT NULL, CHECK `role IN ('owner', 'partner', 'member')`)
- `nickname` (TEXT, NULLABLE): Panggilan akrab (misal: "Ayah", "Bunda", "Mas Abyan").
- `joined_at` (TIMESTAMPTZ, DEFAULT `now()`)
- **Constraint Unik**: `UNIQUE(space_id, user_id)`: Mencegah user bergabung dua kali ke space yang sama.

### 5.4 Tabel `public.categories`
Kategori transaksi kas (bawaan sistem dan kustom per ruang).
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `space_id` (UUID, NULLABLE, Foreign Key &rarr; `public.spaces(id)` ON DELETE CASCADE): Bernilai `NULL` untuk kategori bawaan sistem.
- `name` (TEXT, NOT NULL): Nama kategori (misal: "Makanan & Minuman").
- `type` (VARCHAR(10), NOT NULL, CHECK `type IN ('income', 'expense')`).
- `icon` (TEXT, DEFAULT `'tag'`).
- `color` (TEXT, DEFAULT `'#10B981'`).
- `is_system` (BOOLEAN, DEFAULT `false`).
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

### 5.5 Tabel `public.transactions`
Buku kas pencatatan transaksi resmi.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `space_id` (UUID, NOT NULL, Foreign Key &rarr; `public.spaces(id)` ON DELETE CASCADE)
- `user_id` (UUID, NULLABLE, Foreign Key &rarr; `public.profiles(id)` ON DELETE SET NULL)
- `category_id` (UUID, NOT NULL, Foreign Key &rarr; `public.categories(id)` ON DELETE RESTRICT)
- `type` (VARCHAR(10), NOT NULL, CHECK `type IN ('income', 'expense')`)
- `amount` (NUMERIC(15, 2), NOT NULL, CHECK `amount > 0`)
- `transaction_date` (TIMESTAMPTZ, DEFAULT `now()`, NOT NULL)
- `description` (TEXT, NULLABLE)
- `source` (VARCHAR(20), DEFAULT `'manual'`, CHECK `source IN ('manual', 'webhook', 'ocr')`)
- `receipt_url` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`)

### 5.6 Tabel `public.pending_validations`
Antrean penerimaan notifikasi otomatis perbankan dan hasil pemindaian sebelum disetujui.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `space_id` (UUID, NOT NULL, Foreign Key &rarr; `public.spaces(id)` ON DELETE CASCADE)
- `raw_text` (TEXT, NOT NULL): Teks asli notifikasi.
- `source_app` (VARCHAR(50), NOT NULL): Nama aplikasi terdeteksi (BCA, GoPay, ShopeePay, dll).
- `parsed_amount` (NUMERIC(15, 2), NULLABLE): Estimasi nominal hasil regex.
- `parsed_type` (VARCHAR(10), DEFAULT `'expense'`, CHECK `parsed_type IN ('income', 'expense')`)
- `parsed_merchant` (TEXT, NULLABLE): Estimasi nama merchant atau penerima transfer.
- `suggested_category_id` (UUID, NULLABLE, Foreign Key &rarr; `public.categories(id)` ON DELETE SET NULL)
- `status` (VARCHAR(20), DEFAULT `'pending'`, NOT NULL, CHECK `status IN ('pending', 'approved', 'rejected')`)
- `idempotency_hash` (TEXT, UNIQUE, NOT NULL): Hash penangkal duplikasi `sha256(space_id_app_text_datehour)`.
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)
- `resolved_at` (TIMESTAMPTZ, NULLABLE)
- `resolved_by` (UUID, NULLABLE, Foreign Key &rarr; `public.profiles(id)` ON DELETE SET NULL)

### 5.7 Database Indexes
- `idx_space_members_user`: `ON public.space_members(user_id)`
- `idx_space_members_space`: `ON public.space_members(space_id)`
- `idx_transactions_space_date`: `ON public.transactions(space_id, transaction_date DESC)`
- `idx_pending_space_status`: `ON public.pending_validations(space_id, status) WHERE status = 'pending'` (Partial index untuk kecepatan polling/query antrean aktif)
- `idx_categories_space`: `ON public.categories(space_id)`

---

## 6. Authorization Model & Row-Level Security (RLS)

Prinsip fundamental:  
> **Authentication proves identity. Authorization determines what that identity may access.**

### 6.1 Helper Security Definer `is_space_member`
Untuk mencegah rekursi tak terbatas (*infinite recursion*) pada RLS policy antar tabel, keanggotaan space divalidasi melalui fungsi SQL STABLE:
```sql
CREATE OR REPLACE FUNCTION public.is_space_member(_space_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = _space_id AND user_id = auth.uid()
  );
$$;
```

### 6.2 Ringkasan Kebijakan RLS (RLS Matrix)
Seluruh 6 tabel dalam schema memiliki `ENABLE ROW LEVEL SECURITY`:

| Tabel | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Milik sendiri OR partner di Space yang sama | Otomatis via Trigger | `id = auth.uid()` | Dilarang |
| `spaces` | `is_space_member(id)` | `auth.role() = 'authenticated'` | `is_space_member(id)` | Dilarang (Kecuali cascade) |
| `space_members` | `is_space_member(space_id)` | `user_id = auth.uid() OR is_space_member(space_id)` | `is_space_member(space_id)` | Dilarang |
| `categories` | `is_system = true OR is_space_member(space_id)` | `is_space_member(space_id)` | `is_space_member(space_id)` | `is_space_member(space_id)` |
| `transactions` | `is_space_member(space_id)` | `is_space_member(space_id)` | `is_space_member(space_id)` | `is_space_member(space_id)` |
| `pending_validations` | `is_space_member(space_id)` | Service-Role (Webhook) / Klien | `is_space_member(space_id)` | `is_space_member(space_id)` |

---

## 7. Security Boundaries & Trust Zones

Sistem mendefinisikan 5 zona kepercayaan (*trust boundaries*):

1. **Browser / PWA Client (Untrusted)**: Seluruh input pengguna, header browser, dan kode klien berada di luar perimeter kepercayaan. Validasi klien hanya berfungsi untuk UX dan kenyamanan pengguna.
2. **Next.js Server Actions & Route Handlers (Application Boundary)**: Mengeksekusi validasi skema, sanitasi teks, batas panjang data, dan pengecekan sesi sebelum mengirim kueri ke database.
3. **Webhook Route Handler (Untrusted External Boundary)**: Menerima payload dari aplikasi MacroDroid di ponsel Android pengguna. Memerlukan autentikasi secret token, pembatasan ukuran payload (32KB), pembatasan panjang teks (1000 karakter), dan penolakan parameter URL.
4. **Scoped Supabase Client (RLS-Enforced)**: Klien default yang beroperasi atas nama pengguna terotentikasi (`auth.uid()`). Seluruh operasi dibatasi oleh aturan RLS PostgreSQL.
5. **Privileged Admin Client (`createAdminClient`)**: Hanya diizinkan digunakan di server internal Route Handler Webhook untuk mencari Space berdasarkan hash token dan menulis ke `pending_validations`. Dilarang keras diekspor ke komponen klien atau Server Actions umum.
6. **PostgreSQL Database Engine (Final Enforcement Layer)**: Penegak integritas tertinggi melalui skema foreign key, check constraints, unique constraints, dan stored procedures atomic `SECURITY DEFINER`.

---

## 8. Webhook Architecture & Push Ingestion

- **Endpoint**: `POST /api/v1/webhook/notify`
- **Format Kunci**: Kunci berformat `ckp_live_<64hex>`. Dibuat dengan entropi 192-bit (`crypto.randomBytes(24)`).
- **Penyimpanan Token**: Server hanya menyimpan hasil SHA-256 dari kunci di kolom `spaces.webhook_token_hash`.
- **Rotasi Token**: Pengguna dapat merotasi token kapan saja via menu pengaturan Space. Pemanggilan fungsi `rotate_space_webhook_token` secara instan menganulir token lama. Token plaintext baru hanya ditampilkan satu kali ke layar pengguna.
- **Batasan Payload**:
  - Request body maksimal **32 KB** (`Content-Length` inspection). Request melebihi batas langsung ditolak dengan HTTP 413.
  - Teks notifikasi maksimal **1.000 karakter**. Melebihi batas ditolak dengan HTTP 400.
  - Larangan Query String: Penggunaan `?key=...` langsung ditolak dengan HTTP 400 (`SEC-002`). Token wajib dikirimkan melalui header `X-Celengan-Key` atau `Authorization: Bearer <token>`.
- **Dukungan Bank & E-Wallet**:
  - **BCA**: Transaksi QRIS, m-Transfer keluar, transfer masuk (kredit).
  - **GoPay**: Pembayaran QRIS/merchant, transfer GoPay keluar, saldo masuk.
  - **ShopeePay**: Pembayaran merchant, transfer keluar, top up / saldo masuk.
  - **BRI (BRImo)**: Transaksi debit, QRIS BRI, transaksi kredit (dana masuk).
  - **BNI**: Transaksi debit, transfer keluar, QRIS, setoran masuk.
  - **SeaBank**: Transfer keluar, pembayaran QRIS, transfer masuk.
  - **Fallback Heuristik**: Pencarian pola `Rp [angka]` generik jika format spesifik tidak persis cocok.

---

## 9. Idempotency Model & Concurrency Safety

Otomasi Android atau pengiriman ulang jaringan seluler dapat mengirimkan notifikasi push yang sama berulang kali. CelenganKita menerapkan deduplikasi deterministik di level database:

### 9.1 Formula Idempotency Hash
$$\text{IdempotencyString} = \text{space\_id} \mathbin{\Vert} \text{source\_app} \mathbin{\Vert} \text{raw\_text} \mathbin{\Vert} \text{YYYY-MM-DDTHH}$$
$$\text{idempotency\_hash} = \text{SHA-256}(\text{IdempotencyString})$$

Dengan menyertakan komponen jam (`YYYY-MM-DDTHH`), notifikasi yang sama dalam rentang 1 jam dijamin menghasilkan hash identik. Jika ada transaksi bernominal dan merchant persis sama yang terjadi beberapa jam kemudian, hash baru akan dihasilkan secara sah.

### 9.2 Penanganan Konkurensi Database
Pemeriksaan di level aplikasi (`SELECT` lalu `INSERT`) rentan terhadap race condition. Sistem menggunakan perintah SQL:
```sql
INSERT INTO public.pending_validations (...)
VALUES (...)
ON CONFLICT (idempotency_hash) DO NOTHING;
```
Jika terjadi pelanggaran konkurensi (PostgreSQL error code `23505` `unique_violation`), Route Handler menangkap exception tersebut dan merespons secara aman:
```json
{
  "status": "ignored",
  "message": "Notifikasi duplikat berhasil diabaikan."
}
```

---

## 10. Transaction & Validation Model (Atomic Operations)

Proses validasi notifikasi menjadi transaksi kas resmi melibatkan perpindahan state yang sensitif terhadap konkurensi:

### 10.1 RPC `approve_pending_validation_atomic`
Untuk mencegah pasangan A dan pasangan B menekan tombol "Setujui" pada saat bersamaan:
1. Menetapkan `SET search_path = public, pg_temp` secara ketat.
2. Melakukan `UPDATE pending_validations SET status = 'approved'` dengan klausa `WHERE id = _validation_id AND status = 'pending' RETURNING ...`.
3. Jika baris yang ter-update kosong (karena sudah disetujui atau ditolak sebelumnya), fungsi mengembalikan status `'already_resolved'` tanpa menyisipkan transaksi.
4. Jika baris berhasil diupdate, fungsi menyisipkan record baru ke `public.transactions` dalam satu transaksi atomic database.

### 10.2 RPC `reject_pending_validation_atomic`
1. Menetapkan `SET search_path = public, pg_temp`.
2. Melakukan verifikasi bahwa pengguna terotentikasi adalah anggota sah dari Space terkait.
3. Mengubah status baris dari `'pending'` menjadi `'rejected'`.
4. Menolak mutasi jika status awal bukan `'pending'`.

---

## 11. OCR Architecture & In-Browser Processing

- **Modul Engine**: `tesseract.js` versi `^6.0.0` dimuat secara asinkron (*lazy dynamic import*) saat pengguna membuka pemindai struk.
- **Isolasi Thread**: Tesseract dieksekusi di dalam **Web Worker** latar belakang agar thread UI utama tidak mengalami freezing (*jank*).
- **Pra-Pemrosesan Gambar (Canvas Binarization)**:
  - Dimensi gambar dibatasi maksimal 1500px untuk menjaga konsumsi RAM ponsel.
  - Konversi warna piksel ke format Grayscale: $\text{Gray} = 0.299R + 0.587G + 0.114B$.
  - Penguatan kontras (*contrast boost*): Piksel terang diperjelas dan piksel abu-abu digelapkan untuk mempertegas teks cetakan struk thermal.
- **Ekstraksi Heuristik Teks**:
  - Nama toko diekstrak dari 4 baris teks teratas struk non-metadata.
  - Nominal total dicari dari baris yang memuat kata kunci: `TOTAL`, `TOTAL BELANJA`, `GRAND TOTAL`, `BAYAR`, `NETTO`, `TAGIHAN`.
  - Jika kata kunci tidak ditemukan, algoritma mengambil angka terbesar yang masuk akal di dalam struk.
- **Invarian Privasi**: Gambar struk berada 100% di memori browser dan langsung dibuang setelah ekstraksi selesai. Tidak ada byte gambar yang dikirim ke jaringan.

---

## 12. PWA Architecture & Service Worker Security

- **Web App Manifest**: Berada di `/manifest.json`, mendukung mode tampilan `standalone`, warna tema emerald (`#10b981`), dan orientasi `portrait`.
- **Kebijakan Cache Service Worker (`/public/sw.js`)**:
  - **Cache Static Only**: Hanya menyimpan cache aset statis terdaftar (`/manifest.json`, `/icons/*`).
  - **Bypass Mutlak untuk Data Finansial**: Service worker secara eksplisit **menolak** menyimpan cache terhadap:
    - Seluruh permintaan yang berawalan `/api/`
    - Seluruh permintaan ke domain database (`*.supabase.co`)
    - Seluruh permintaan navigasi halaman HTML (`request.mode === 'navigate'`)
  - Hal ini menjamin bahwa data keuangan tidak pernah tersimpan di cache luring publik atau tertinggal setelah pengguna melakukan logout.

---

## 13. UI/UX Architecture & Design System

Desain sistem CelenganKita menggunakan pendekatan **dark-first** yang tenang, bersih, dan fungsional:

### 13.1 Token Warna & Nuansa
- **Background Utama**: `bg-slate-950` / `bg-slate-900` (mode gelap nyaman di mata).
- **Permukaan Kartu**: `bg-slate-900/60` berbingkai `border-slate-800`.
- **Pemasukan (*Income*)**: Lencana dan teks `emerald-500` / `emerald-400`.
- **Pengeluaran (*Expense*)**: Lencana dan teks `rose-500` / `rose-400`.
- **Aksen Aksi Utama**: Tombol `bg-teal-600 hover:bg-teal-500` dengan kontras teks putih.
- **Antrean Notifikasi**: Lencana perhatian `amber-500/10 text-amber-400 border-amber-500/20`.

### 13.2 Komponen Inti
- `CurrencyInput`: Input khusus Rupiah yang memformat angka ribuan secara real-time (`20.000`), menyaring karakter non-angka tanpa menggunakan atribut `pattern` yang memblokir form submit.
- `Button`: Mendukung varian `primary`, `secondary`, `destructive`, `outline`, dan state loading terintegrasi (`Loader2`).
- `ConfirmModal`: Dialog konfirmasi untuk aksi destruktif (hapus transaksi, rotasi key) dengan pengelolaan fokus dan penutupan via tombol Escape.
- `BottomNav`: Bilah navigasi bawah tetap (*fixed bottom*) dengan indikator rute aktif dan target sentuh minimal 44px.

---

## 14. Accessibility Requirements (Target: WCAG 2.2 AA)

1. **Aksesibilitas Keyboard**: Semua elemen interaktif dapat dijangkau menggunakan tombol `Tab`, diaktifkan dengan `Enter`/`Space`, dan memiliki indikator visual `focus-visible:ring-2`.
2. **Label Form Eksplisit**: Setiap elemen `<input>` dan `<select>` terikat dengan elemen `<label>` melalui atribut `id` dan `htmlFor`.
3. **Viewport & Zoom**: Pengaturan `viewport` di `layout.tsx` tidak pernah menonaktifkan zoom pengguna (`user-scalable=no` dilarang).
4. **Target Sentuh (*Touch Targets*)**: Seluruh tombol, field form, dan tab navigasi memiliki tinggi dan lebar minimal **44×44 CSS pixels**.
5. **Kontras Warna**: Teks pada tombol dan latar belakang memenuhi rasio kontras minimal **4.5:1** untuk teks normal dan **3:1** untuk teks besar sesuai standar WCAG AA.
6. **Live Regions**: Feedback kesalahan form menggunakan `role="alert"` atau `aria-live="polite"` agar dapat dibacakan oleh pembaca layar (*screen reader*).
7. **Prefers-Reduced-Motion**: Komponen transisi dan animasi menghormati preferensi `prefers-reduced-motion: reduce`.

---

## 15. Validation & Error Handling Architecture

1. **Prinsip Zero Trust Server**: Server tidak pernah mempercayai field tersembunyi (*hidden input*), field non-aktif (*disabled*), atau klaim otorisasi yang dikirimkan oleh klien.
2. **Sanitasi Pesan Error (Error Sanitization)**:
   - Exception internal database (PostgreSQL error, stack trace, nama file server) dicatat di log server via `console.error`.
   - Pesan yang dikembalikan kepada pengguna selalu dibungkus dalam bahasa Indonesia yang ramah, santun, dan aman:  
     Contoh: *"Kode undangan tidak valid atau kedaluwarsa."* (bukan SQL syntax error).
3. **Validasi Tipe Data**: Seluruh nominal divalidasi `isFinite(amount) && amount > 0 && amount <= 1_000_000_000_000` untuk mencegah integer overflow atau injeksi angka negatif.

---

## 16. Security Requirements (Threat Model Matrix)

| Mekanisme | Ancaman (*Threat*) | Skenario Serangan | Perlindungan (*Protection*) | Verifikasi (*Verification*) | Status | Remediasi Terpasang |
|---|---|---|---|---|---|---|
| **RLS Isolation** | IDOR / Akses Lintas Space | Penyerang mengganti `space_id` di form untuk membaca transaksi pasangan lain | RLS PostgreSQL memeriksa `is_space_member(space_id)` pada setiap query | Policy RLS di `transactions`, `spaces`, `pending_validations` | `IMPLEMENTED` | Akses ditolak di level engine DB jika bukan anggota. |
| **Webhook Auth** | Injeksi Webhook Palsu | Penyerang mengirim HTTP POST acak untuk memasukkan data kas fiktif | Wajib header `X-Celengan-Key` atau `Bearer` yang cocok dengan SHA-256 hash di DB | Route handler mengembalikan HTTP 401 jika key tidak cocok | `IMPLEMENTED` | Secret disimpan ter-hash, rotasi instan membatalkan key lama. |
| **URL Token Privacy** | Kebocoran Kunci di Log | Kunci API ditaruh di query param `?key=...` dan tercatat di proxy log | Route handler menolak request yang memiliki query `key` dengan HTTP 400 | Automated security test `test-webhook-security.mjs` | `IMPLEMENTED` | Penolakan eksplisit pada baris 9 route handler. |
| **Anti-Replay / Deduplikasi** | Transaksi Ganda | Jaringan ponsel mengirim ulang notifikasi push 5 kali berturut-turut | Kolom `idempotency_hash` dengan constraint UNIQUE di database | Upsert `ignoreDuplicates: true`, respons HTTP 200 `ignored` | `IMPLEMENTED` | Database-level unique constraint menjamin nol duplikasi. |
| **Payload Limiting** | DoS / Memory Exhaustion | Penyerang mengirim payload JSON 50MB ke route handler webhook | Pemeriksaan header `content-length` > 32KB & teks notifikasi > 1000 char | Route handler mengembalikan HTTP 413 / HTTP 400 sebelum parsing | `IMPLEMENTED` | Validasi ukuran dilakukan di langkah awal handler. |
| **Atomic Approval** | Race Condition Approval | Suami dan istri menekan tombol Approve pada waktu bersamaan | RPC `approve_pending_validation_atomic` mengupdate status secara kondisional | RPC hanya memproses baris yang berstatus `pending` | `IMPLEMENTED` | Transaksi kedua menerima status `already_resolved`. |
| **Safe Search Path** | Search Path Hijacking | Penyerang memanipulasi skema pencarian fungsi `SECURITY DEFINER` | Menetapkan `SET search_path = public, pg_temp` pada setiap RPC | Dideklarasikan di `supabase/schema.sql` dan migrasi hardening | `IMPLEMENTED` | Search path terkunci pada skema tepercaya. |
| **PWA Cache Isolation** | Kebocoran Data di Perangkat Bersama | Service worker menyimpan cache mutasi kas yang bisa dibuka luring tanpa login | Service worker menolak cache rute HTML, `/api/`, dan domain Supabase | Inspeksi kode `public/sw.js` fetch handler | `IMPLEMENTED` | Cache storage hanya memuat manifest dan ikon statis. |

---

## 17. Non-Functional Requirements (NFR)

1. **Performa**:
   - Respon Webhook Ingestion API < 150 ms.
   - Waktu inisialisasi cold-start Next.js Standalone < 2 detik.
2. **Skalabilitas**:
   - Arsitektur stateless memungkinkan replikasi horizontal otomatis pada Google Cloud Run.
3. **Keandalan**:
   - Ketersediaan basis data 99.9% mengikuti SLA Supabase Managed PostgreSQL.
4. **Biaya Operasional**:
   - Rp0 / bulan pada volume penggunaan keluarga wajar (kapasitas Cloud Run Always Free Tier 2 juta request/bulan).
5. **Kompatibilitas**:
   - Berjalan lancar pada browser mobile modern: Chrome Android (v100+), Safari iOS (v15+), Samsung Internet, Firefox Mobile.

---

## 18. Deployment Architecture (Target Always Free Tier)

```text
[ Pengguna Seluler ]
       │
       ▼ (HTTPS / DNS Anycast)
[ Cloudflare Free Plan (DNS Proxy + Jakarta Edge Caching) ]
       │
       ▼ (Origin Request / Latensi US-ID Teroptimasi)
[ Google Cloud Run (Region us-central1 - Always Free Tier) ]
  ├── Container: Node.js 20 Alpine Standalone
  ├── RAM: 512 MiB
  ├── CPU: 1 vCPU (dibatasi 0 - 1 instance)
  └── Port: 8080
       │
       ▼ (Secure Connection Pooler)
[ Supabase PostgreSQL Free Tier (Managed DB + Auth) ]
```

*Catatan Status*: Konfigurasi Dockerfile dan konfigurasi Next.js standalone telah `IMPLEMENTED` di repositori. Script deployment Cloud Run dan konfigurasi Cloudflare berada pada status `PLANNED`.

---

## 19. Environment & Secrets Management

Semua variabel rahasia dikelola melalui environment variables dan tidak pernah di-commit ke repositori:

| Nama Variabel | Lingkup | Keterangan & Tingkat Sensitivitas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Klien & Server | URL proyek Supabase (Publik, contoh: `https://xxxx.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Klien & Server | Kunci anon publik Supabase; aman diekspos ke browser karena dilindungi RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only** | Kunci hak istimewa tinggi (*bypasses RLS*). **DILARANG KERAS** diekspos ke klien atau browser. Hanya digunakan di Route Handler Webhook. |
| `NEXT_PUBLIC_SITE_URL` | Klien & Server | URL basis aplikasi (contoh: `http://localhost:3000` atau `https://celengankita.id`). |

---

## 20. Technical Constraints & Architectural Decision Records (ADR)

### ADR-01: Pemilihan Next.js Fullstack Monorepo vs Backend Java/Spring Boot Terpisah
- **Konteks**: Muncul wacana penambahan backend enterprise Java/Spring Boot.
- **Keputusan**: DITOLAK. Tetap menggunakan Next.js Fullstack (App Router).
- **Rasional**:
  1. Kontainer Java Virtual Machine (JVM) membutuhkan memori minimal 512MB–1GB RAM hanya untuk runtime awal, melebihi kuota Always Free Tier Google Cloud Run.
  2. Next.js Standalone Node 20 hanya mengonsumsi 50–90MB RAM saat idling dan mendukung cold start sub-detik.
  3. Memelihara dua repositori/layanan melipatgandakan kompleksitas deployment tanpa memberikan nilai tambah pada skala pasangan.

### ADR-02: Pemrosesan OCR Sisi Klien (Tesseract.js) vs API Cloud Vision
- **Konteks**: Ekstraksi struk belanja membutuhkan pemrosesan gambar beresolusi tinggi.
- **Keputusan**: DITERIMA. Pemrosesan dilakukan 100% di browser pengguna melalui Tesseract.js Web Worker.
- **Rasional**:
  1. Menghilangkan biaya API pihak ketiga (Google Cloud Vision berbayar setelah 1.000 request).
  2. Menghilangkan konsumsi memori dan vCPU pada kontainer Cloud Run (0 detik pemakaian server vCPU).
  3. Menjamin privasi mutlak pengguna karena foto struk tidak pernah meninggalkan perangkat.

### ADR-03: Pemisahan Kunci Webhook dari Kode Undangan Space
- **Konteks**: Implementasi awal menggunakan kode undangan 8 karakter sebagai kunci webhook MacroDroid.
- **Keputusan**: DITERIMA (`SEC-002`). Memisahkan kode undangan dan token webhook secara tegas.
- **Rasional**:
  1. Kode undangan dibagikan antar pasangan melalui WhatsApp dan sering tersimpan di clipboard atau riwayat pesan.
  2. Kunci webhook adalah kredensial mesin berpanjang 192-bit (`ckp_live_...`) yang disimpan dalam bentuk hash SHA-256 dan dapat dirotasi kapan saja tanpa mengubah status keanggotaan Space.

### ADR-04: Penggunaan Stored Procedures Atomic (RPC) dengan Search Path Aman
- **Konteks**: Operasi join space, rotasi kunci, dan approval validasi rawan race condition dan eksploitasi search_path.
- **Keputusan**: DITERIMA (`SEC-001`). Membungkus seluruh logika mutasi beresiko dalam RPC PostgreSQL `SECURITY DEFINER` dengan `SET search_path = public, pg_temp`.
- **Rasional**: Menjamin transaksi single-roundtrip database yang kebal terhadap pembajakan skema dan race condition antar pasangan.

---

## 21. Known Risks & Technical Debt Matrix

| ID | Risiko Teknis / Keterbatasan | Tingkat Keparahan | Status Aktual | Rencana Mitigasi |
|---|---|---|---|---|
| **RSK-01** | Variasi Format Notifikasi Android | Sedang | `PARTIAL` | Format notifikasi bank dapat berubah sewaktu-waktu akibat pembaruan aplikasi bank. Mitigasi: Test suite berkala (`scripts/test-parser.mjs`) dan fallback ke heuristik generik jika regex spesifik gagal. |
| **RSK-02** | Akurasi OCR pada Struk Rusak/Buram | Sedang | `PARTIAL` | Struk belanja thermal yang kusut atau buram menghasilkan teks yang tidak sempurna. Mitigasi: Pengguna wajib mereview hasil OCR di form manual sebelum menyimpan. |
| **RSK-03** | Cold Start Serverless Cloud Run | Rendah | `PARTIAL` | Penundaan 2–4 detik pada request pertama setelah periode hening (*scale-to-zero*). Mitigasi: Aset statis dan PWA shell dilayani dari Cache Cloudflare Edge Jakarta. |
| **RSK-04** | Ketergantungan pada Aplikasi MacroDroid | Rendah | `IMPLEMENTED` | Pengguna iOS tidak dapat menjalankan MacroDroid untuk menangkap push notifikasi. Mitigasi: Pengguna iOS tetap dapat mencatat transaksi secara manual dan menggunakan pemindai OCR struk. |
| **RSK-05** | Dokumentasi README Lama Belum Diperbarui | Rendah | `IDENTIFIED` | README.md lama masih menyebutkan kode undangan sebagai kunci webhook dan mencantumkan integrasi email Resend yang belum terpasang di dependensi. Mitigasi: Diperbaiki melalui pemutakhiran dokumentasi resmi ini. |

---
*Dokumen ini merupakan spesifikasi teknis resmi CelenganKita. Segala implementasi kode wajib mengacu dan mematuhi batas-batas teknis yang ditetapkan dalam SRS ini.*
