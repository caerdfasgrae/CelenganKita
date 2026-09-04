# Product Requirements Document (PRD) — CelenganKita

**Document Version:** 1.0.0  
**Status:** Active Baseline / Source of Truth  
**Target Platform:** Mobile-First Progressive Web App (PWA)  
**Primary Market:** Pasangan di Indonesia (Dua Pengguna per Ruang Anggaran)  
**Cost Constraint:** Target Rp0 / Always Free Tier Infrastructure  

---

## 1. Product Overview

**CelenganKita** adalah aplikasi manajemen anggaran dan pencatatan keuangan bersama (*shared budgeting*) yang dirancang khusus untuk pasangan di Indonesia (suami-istri, tunangan, atau pasangan yang merencanakan keuangan bersama). 

Aplikasi ini mengusung pendekatan **mobile-first Progressive Web App (PWA)** sehingga pengguna dapat menginstalnya langsung ke layar beranda (homescreen) ponsel tanpa perlu mengunduh dari app store dan tanpa biaya listing pengembang.

CelenganKita beroperasi pada model **Ruang Anggaran Bersama (Shared Space)**:
- Dua pasangan terhubung dalam satu *Space* melalui kode undangan 8 karakter yang aman.
- Semua transaksi pemasukan, pengeluaran, kategori anggaran, dan saldo kas dipantau secara transparan dan terisolasi secara kriptografis menggunakan Row-Level Security (RLS) PostgreSQL.
- CelenganKita menghadirkan otomasi pencatatan melalui dua pintu masuk utama:
  1. **Sinkronisasi Notifikasi Otomatis Android**: Mengintegrasikan notifikasi transaksi bank dan e-wallet lokal (BCA, GoPay, ShopeePay, BRI/BRImo, BNI, SeaBank) melalui perantara alat otomasi seperti MacroDroid/Tasker ke webhook server CelenganKita.
  2. **Pemindai Struk & Bukti Transfer OCR**: Pemrosesan gambar struk belanja menggunakan Tesseract.js yang dieksekusi 100% di browser ponsel pengguna tanpa membebani server backend.
- Seluruh data yang masuk dari otomasi dan OCR tunduk pada prinsip mutlak **Human-in-the-Loop**: data notifikasi atau hasil scan tidak pernah menjadi catatan transaksi resmi sebelum disetujui secara eksplisit oleh salah satu pasangan.

Untuk mempertahankan sifat inklusif dan gratis bagi pengguna, CelenganKita dirancang dengan batasan ketat: **arsitektur komputasi efisien yang memenuhi kuota Always Free Tier (Google Cloud Run + Supabase PostgreSQL Free Tier + Cloudflare Free Plan)**.

---

## 2. Problem Statement

Pasangan muda maupun keluarga di Indonesia menghadapi kendala finansial harian yang khas:
1. **Pencatatan Manual yang Melelahkan (*High Friction*)**: Mencatat setiap pengeluaran (makan siang, belanja minimarket, bensin, token listrik) di aplikasi konvensional atau spreadsheet sering terbengkalai karena repot dan membutuhkan disiplin tinggi.
2. **Ketiadaan Transparansi Finansial Pasangan**: Sebagian besar aplikasi budgeting di pasar bersifat *single-user*. Pasangan terpaksa saling bertanya nominal pengeluaran di chat WhatsApp, memicu kesalahpahaman atau hilangnya rekam jejak kas rumah tangga.
3. **Keterbatasan Akun Bank Bersama (*Joint Account*)**: Layanan rekening bersama resmi dari perbankan konvensional di Indonesia relatif rumit dibuat, memerlukan biaya administrasi bulanan tambahan, dan jarang mendukung dompet digital (e-wallet) yang paling sering digunakan sehari-hari.
4. **Biaya Aplikasi Pihak Ketiga**: Aplikasi keuangan pasangan global mengenakan biaya langganan bulanan yang memberatkan dan tidak terintegrasi dengan ekosistem finansial Indonesia (format rupiah, nama merchant lokal, QRIS, e-wallet).

---

## 3. Product Vision

Menghadirkan pendamping keuangan harian yang **tenang, transparan, harmonis, hemat biaya, dan terpercaya** bagi pasangan Indonesia.

CelenganKita bukan sekadar buku kas, melainkan ruang komunikasi finansial berdua yang:
- **Tenang & Restrained**: Menghindari antarmuka ramai yang membuat cemas; menyajikan ringkasan kas yang jernih dan melegakan.
- **Predictable & Accurate**: Angka keuangan disajikan apa adanya tanpa asumsi tersembunyi, dengan format mata uang rupiah standar (`Rp 50.000`).
- **Privacy-Conscious**: Data keuangan pasangan bersifat privat mutlak. Tidak ada pelacak pihak ketiga, tidak ada monetisasi data transaksi, dan token otomasi dipisahkan secara ketat dari identitas pengguna.
- **Human-in-the-Loop**: Otomasi bertindak sebagai asisten pengingat, sedangkan keputusan pencatatan kas resmi tetap berada di tangan pasangan.

---

## 4. Target Users

### Persona Primer: Pasangan Rumah Tangga / Pasangan Menuju Pernikahan di Indonesia
- **Karakteristik**: Berusia 22–38 tahun, aktif bertransaksi non-tunai harian menggunakan QRIS, m-Banking (BCA, BRImo, BNI, SeaBank), dan e-Wallet (GoPay, ShopeePay).
- **Perilaku Digital**: 90%+ aktivitas perbankan dilakukan melalui smartphone (Android & iOS).
- **Tujuan Finansial**: Memantau pengeluaran operasional bersama, memastikan kas bulanan terkontrol, dan menjaga transparansi tanpa rasa saling mencurigai.
- **Batasan Teknis**: Menginginkan aplikasi yang ringan, dapat dibuka cepat, tidak memakan memori ponsel, dan tidak memerlukan registrasi yang rumit.

---

## 5. Core User Problems & Jobs To Be Done (JTBD)

| Saat Situasi (When) | Pengguna Ingin (I want to) | Agar Supaya (So that) |
|---|---|---|
| Mendaftar pertama kali | Membuat Ruang Anggaran Bersama (*Space*) dan mendapatkan kode undangan | Pasangan saya dapat langsung bergabung ke ruang dompet yang sama dalam satu langkah mudah. |
| Menerima kode undangan dari pasangan | Memasukkan kode 8 karakter di aplikasi | Saya langsung terhubung ke kas bersama tanpa perlu setup berbelit-belit. |
| Berbelanja harian secara tunai/debit | Mencatat pemasukan/pengeluaran manual dengan cepat beserta kategorinya | Saldo kas bersama selalu mutakhir dan tercatat rapi. |
| Menerima notifikasi pembayaran m-Banking/e-Wallet di Android | Notifikasi tersebut otomatis masuk ke antrean "Perlu Validasi" CelenganKita | Saya dan pasangan tidak perlu mengetik ulang nominal dan nama toko dari nol. |
| Meninjau antrean transaksi otomatis | Menyetujui (*Approve*) atau menolak (*Reject*) mutasi dengan memilih kategori yang pas | Transaksi yang masuk ke pembukuan resmi terjamin kebenarannya (*Human-in-the-Loop*). |
| Membawa struk fisik belanja supermarket | Memfoto struk langsung di aplikasi untuk membaca total belanja | Nilai transaksi terisi otomatis tanpa salah ketik, lalu tinggal saya simpan. |
| Membuka aplikasi setiap hari | Melihat ringkasan total pengeluaran, pemasukan, dan saldo bulan berjalan | Kami berdua selalu sadar posisi keuangan bersama tanpa tebak-tebakkan. |

---

## 6. MVP Scope

### 6.1 In Scope (MVP Aktif)
1. **Autentikasi Pengguna**: Registrasi & Login berbasis email dan password melalui Supabase Auth.
2. **Manajemen Space**:
   - Pembuatan Space baru (role: `owner`).
   - Bergabung ke Space pasangan menggunakan kode undangan 8 karakter (role: `partner`).
   - Pengaturan nama Space dan nama panggilan pasangan (*nickname*).
3. **Pencatatan Transaksi Manual**:
   - Form pencatatan pemasukan (*income*) dan pengeluaran (*expense*).
   - Input mata uang Rupiah Indonesia (`Rp`) dengan penanganan pemisah ribuan titik.
   - Pilihan kategori bertipe sesuai jenis transaksi.
   - Penyesuaian tanggal transaksi dengan zona waktu Indonesia Barat (WIB / UTC+7).
4. **Dasbor Finansial Pasangan**:
   - Kartu ringkasan kas (Total Saldo, Pemasukan Bulan Ini, Pengeluaran Bulan Ini).
   - Banner notifikasi antrean validasi aktif.
   - Daftar mutasi transaksi terbaru dengan pembeda warna yang tenang (hijau untuk pemasukan, merah/rose untuk pengeluaran).
5. **Riwayat & Filter Transaksi**:
   - Daftar riwayat transaksi lengkap.
   - Filter cepat berdasarkan tipe (*Semua*, *Pengeluaran*, *Pemasukan*).
   - Tombol hapus transaksi dengan modal konfirmasi eksplisit (*destructive confirmation*).
6. **Ingesti Webhook Otomatis (Fitur 1 - Android)**:
   - Endpoint HTTP Route Handler `/api/v1/webhook/notify`.
   - Autentikasi ketat via header `X-Celengan-Key` atau `Authorization: Bearer`.
   - Parser regex bawaan untuk notifikasi bank & e-wallet: **BCA, GoPay, ShopeePay, BRI (BRImo), BNI, SeaBank**.
   - Idempotensi anti-duplikasi berbasis SHA-256 database level.
7. **Antrean Validasi Transaksi (*Pending Validations*)**:
   - Daftar notifikasi masuk yang menunggu verifikasi pasangan.
   - Opsi edit nominal dan keterangan sebelum disetujui.
   - Eksekusi atomic approval / rejection via PostgreSQL Database Functions (RPC).
8. **Pemindai OCR Struk Belanja (*Client-Side OCR*)**:
   - Pemrosesan gambar lokal via Tesseract.js di Web Worker.
   - Pre-processing kontras dan grayscale via HTML5 Canvas.
   - Pengambilan gambar via kamera langsung atau galeri file ponsel.
   - Ekstraksi nominal total dan estimasi merchant ke dalam form transaksi manual.
9. **Progressive Web App (PWA)**:
   - Web App Manifest (`manifest.json`) dengan icon 192px dan 512px.
   - Service Worker (`sw.js`) untuk caching aset statis dasar tanpa menyimpan data finansial privat.
   - Tampilan antarmuka mobile-first responsif dengan bilah navigasi bawah (*Bottom Navigation*).

### 6.2 Out of Scope (Sengaja Tidak Dimasukkan ke MVP)
1. **Integrasi Open Banking / Snap API / Direct Bank Aggregator Resmi**: Memerlukan izin PT/badan hukum, biaya langganan bulanan puluhan juta rupiah, dan melanggar prinsip target biaya Rp0.
2. **Transfer Dana Otomatis / Eksekusi Pemindahan Uang**: CelenganKita adalah sistem pencatatan (*ledger tracking*), bukan penyedia jasa pembayaran (PJP) atau sistem kliring.
3. **Eksekusi Otomatis Saldo Tanpa Review (Auto-Commit Webhook)**: Notifikasi webhook tidak boleh langsung memotong/menambah kas resmi tanpa verifikasi manusia.
4. **OCR Sisi Server (Server-Side OCR / Cloud Vision API)**: Pengolahan OCR di server menggunakan memori dan vCPU tinggi yang dapat meruntuhkan kuota Always Free Tier Google Cloud Run.
5. **Aplikasi Native Android/iOS (APK / IPA Terdaftar di Play Store / App Store)**: Memerlukan biaya pendaftaran developer fee tahunan (USD $99 untuk Apple, USD $25 untuk Google) dan pipeline build yang rumit. PWA adalah pilihan definitif.
6. **Multi-Currency Lanjutan**: CelenganKita didedikasikan untuk pasangan di Indonesia; mata uang utama adalah Rupiah (`IDR`).
7. **Multi-Space Kompleks / Multi-User > 2 Orang**: Model MVP difokuskan khusus untuk pasangan berdua (kapasitas 2 pengguna per Space).
8. **Backend Java / Spring Boot Terpisah**: Next.js fullstack standalone memenuhi seluruh kebutuhan API dan UI dalam satu kontainer hemat memori.

---

## 7. Functional Requirements

### FR-01: Autentikasi Pengguna
- **Tujuan**: Memastikan identitas pengguna terdaftar secara valid sebelum dapat mengakses data keuangan.
- **Aktor**: Calon Pengguna, Pengguna Terdaftar.
- **Input**: Email valid, password (minimal 6 karakter), nama lengkap.
- **Expected Behavior**: Registrasi membuat entri di `auth.users` dan mentrigger pembuatan profil di `public.profiles`. Login menghasilkan sesi terenkripsi yang disimpan dalam cookie HTTP.
- **Success Condition**: Pengguna berhasil login dan diarahkan ke `/dashboard` (atau `/space/setup` jika belum memiliki space).
- **Failure Condition**: Email duplikat, format email salah, atau password keliru mengembalikan pesan kesalahan yang santun.
- **Security/Privacy**: Password dikelola oleh Supabase Auth menggunakan hash bcrypt; tidak ada plaintext password yang disimpan atau dikirim ke log.

### FR-02: Pembuatan Ruang Anggaran (Space)
- **Tujuan**: Membuat entitas ruang keuangan bersama pertama kali.
- **Aktor**: Pengguna yang belum memiliki Space.
- **Input**: Nama Ruang (contoh: "Rumah Tangga Abyan & Pasangan"), nama panggilan (*nickname*).
- **Expected Behavior**: Sistem membuat record di `public.spaces`, men-generate kode undangan 8 karakter berentropi tinggi, men-generate webhook token `ckp_live_...` (disimpan sebagai hash SHA-256), dan menambahkan pembuat sebagai `owner` di `public.space_members`.
- **Success Condition**: Space terbentuk, pengguna dialihkan ke `/dashboard`.
- **Failure Condition**: Gagal simpan mengembalikan pesan kesalahan dan tidak mengalihkan halaman.
- **Security/Privacy**: Webhook token plaintext hanya ditampilkan pada sesi pembuatan/rotasi, tidak disimpan dalam bentuk teks biasa di database.

### FR-03: Bergabung ke Space Pasangan
- **Tujuan**: Menghubungkan pasangan kedua ke Space yang sudah dibuat.
- **Aktor**: Pasangan (User B).
- **Input**: Kode undangan 8 karakter, nama panggilan.
- **Expected Behavior**: Sistem mengeksekusi RPC `join_space_by_code` secara atomic; memvalidasi eksistensi kode, memeriksa apakah user sudah bergabung, dan menyematkan user sebagai `partner` di `space_members`.
- **Success Condition**: User B resmi menjadi anggota Space dan dapat melihat riwayat kas yang sama.
- **Failure Condition**: Kode salah atau tidak ditemukan mengembalikan pesan kesalahan standar tanpa membocorkan eksistensi data spesifik.
- **Security/Privacy**: Validasi dijalankan di level database RPC dengan `SECURITY DEFINER` dan `SET search_path = public, pg_temp` untuk mencegah race condition dan enumerasi kode.

### FR-04: Pencatatan Transaksi Manual
- **Tujuan**: Mencatat mutasi keuangan langsung oleh salah satu pasangan.
- **Aktor**: Pasangan (Anggota Space aktif).
- **Input**: Tipe (`expense` atau `income`), nominal (numeric > 0), kategori, deskripsi (maksimal 255 karakter), tanggal transaksi.
- **Expected Behavior**: Server Action memvalidasi input, memeriksa bahwa pengguna adalah anggota sah dari Space tersebut, lalu menginsert catatan ke tabel `public.transactions`.
- **Success Condition**: Transaksi tersimpan, saldo dasbor dan riwayat transaksi terupdate seketika.
- **Failure Condition**: Nominal <= 0, kategori kosong, atau user tidak terafiliasi mengembalikan pesan error.
- **Security/Privacy**: RLS PostgreSQL memastikan hanya anggota terdaftar di `space_members` yang dapat melakukan operasi INSERT/SELECT/UPDATE/DELETE.

### FR-05: Ingesti Webhook Notifikasi Android
- **Tujuan**: Menerima push event notifikasi transaksi perbankan secara instan dari ponsel Android pengguna.
- **Aktor**: Layanan otomasi (MacroDroid / Tasker).
- **Input**: Header `X-Celengan-Key` atau `Authorization: Bearer <token>`, payload JSON/FormData berisi `{ app, text, title }`.
- **Expected Behavior**:
  1. Route Handler menolak request yang membawa token di URL Query Parameter (HTTP 400).
  2. Route Handler memeriksa ukuran payload (maksimal 32 KB) dan panjang teks notifikasi (maksimal 1.000 karakter).
  3. Route Handler mencocokkan SHA-256 dari token ke `spaces.webhook_token_hash`.
  4. Sistem menghitung idempotency hash `sha256(space_id_app_text_YYYY-MM-DDTHH)`.
  5. Sistem mem-parse data transaksi menggunakan regex lokal.
  6. Data di-upsert ke `public.pending_validations`.
- **Success Condition**: Respons HTTP 200 `{ status: "queued", validationId: "..." }`. Jika duplikat terdeteksi, mengembalikan HTTP 200 `{ status: "ignored" }`.
- **Failure Condition**: Token tidak cocok (HTTP 401), ukuran melebihi batas (HTTP 413), teks kosong (HTTP 400).
- **Security/Privacy**: Token webhook tidak pernah dibagikan ke publik; raw text notifikasi dibersihkan dari karakter ilegal.

### FR-06: Validasi Notifikasi (Approval / Rejection)
- **Tujuan**: Memverifikasi data notifikasi masuk sebelum resmi menjadi catatan kas.
- **Aktor**: Pasangan (Anggota Space aktif).
- **Input**: ID validasi, kategori pilihan, koreksi nominal (opsional), koreksi deskripsi (opsional).
- **Expected Behavior**:
  - **Approve**: Mengeksekusi RPC `approve_pending_validation_atomic`. Status diubah dari `pending` ke `approved`, dan record baru dimasukkan ke `public.transactions` dalam satu transaksi PostgreSQL atomic.
  - **Reject**: Mengeksekusi RPC `reject_pending_validation_atomic`. Status diubah dari `pending` ke `rejected`. Tidak ada transaksi kas yang dibuat.
- **Success Condition**: Item validasi hilang dari antrean pending, transaksi kas resmi terbentuk (jika di-approve).
- **Failure Condition**: Item yang sudah disetujui/ditolak oleh pasangan lain tidak dapat diproses ulang (mengembalikan pesan notifikasi sudah diproses).
- **Security/Privacy**: Menggunakan mekanisme atomic database lock/update untuk mencegah *double approval* akibat klik ganda atau akses simultan kedua pasangan.

### FR-07: Pemindaian OCR Struk Belanja
- **Tujuan**: Membantu pasangan menginput total belanja fisik secara cepat tanpa mengetik manual.
- **Aktor**: Pasangan.
- **Input**: Foto struk belanja dari kamera ponsel atau unggahan galeri.
- **Expected Behavior**: Komponen klien membaca gambar, melakukan pra-pemrosesan kontras dan binarisasi grayscale pada HTML5 Canvas, lalu mengirimkan bitmap ke Tesseract.js Web Worker lokal. Teks hasil deteksi dianalisis regex untuk mencari kata kunci "TOTAL" dan nama toko teratas.
- **Success Condition**: Nominal dan deskripsi terisi otomatis pada form transaksi manual, siap diedit oleh pengguna.
- **Failure Condition**: Gambar buram atau tidak terbaca menampilkan pesan bahwa teks tidak terdeteksi, dengan form tetap dapat diisi manual.
- **Security/Privacy**: Gambar struk tidak pernah dikirim ke server backend CelenganKita; data gambar berada sepenuhnya di memori browser pengguna.

---

## 8. Critical User Flows

```mermaid
flowchart TD
    subgraph Onboarding & Space Creation
        U1[Pengguna Baru] -->|Daftar / Login| AUTH[Supabase Auth]
        AUTH --> CHECK_SPACE{Sudah punya Space?}
        CHECK_SPACE -->|Tidak| SETUP[Halaman /space/setup]
        SETUP -->|Pilihan A: Buat Space| CREATE_SPACE[Generate Space + Invite Code + Webhook Token]
        SETUP -->|Pilihan B: Gabung Space| JOIN_SPACE[Input 8-Char Code -> RPC join_space_by_code]
        CREATE_SPACE --> DASH[Dasbor Pasangan]
        JOIN_SPACE --> DASH
        CHECK_SPACE -->|Ya| DASH
    end

    subgraph Manual Financial Ledger
        DASH -->|Klik Catat Transaksi| FORM[Form Transaksi Baru]
        FORM -->|Input Jenis, Nominal, Kategori| SUBMIT_TX[Server Action createManualTransaction]
        SUBMIT_TX -->|RLS Validation| DB_TX[(Tabel transactions)]
        DB_TX --> DASH
    end

    subgraph Automated Webhook Flow
        PHONE[Android MacroDroid/Tasker] -->|POST Header X-Celengan-Key| WH_API[/api/v1/webhook/notify]
        WH_API -->|Validasi Token & Idempotensi| DB_PEND[(Tabel pending_validations)]
        DB_PEND -->|Tampil di Antrean| VAL_PAGE[Halaman /validations]
        VAL_PAGE -->|Setujui Transaksi| RPC_APPROVE[RPC approve_pending_validation_atomic]
        RPC_APPROVE --> DB_TX
        VAL_PAGE -->|Tolak Transaksi| RPC_REJECT[RPC reject_pending_validation_atomic]
    end

    subgraph Client-Side OCR Flow
        FORM -->|Buka Scan Struk| CAM[Kamera / Galeri Ponsel]
        CAM --> CANVAS[Canvas Grayscale & Contrast Preprocessing]
        CANVAS --> TESSERACT[Tesseract.js Web Worker Lokal]
        TESSERACT --> EXTRACT[Ekstraksi Total & Merchant]
        EXTRACT --> FORM
    end
```

---

## 9. Product Invariants

Aturan bisnis mutlak yang tidak boleh dilanggar dalam kondisi apapun:

1. **Space Ownership Invariant**: Seluruh catatan keuangan (transaksi, kategori kustom, antrean validasi) terikat pada satu `space_id`. Tidak ada transaksi tanpa ruang anggaran.
2. **Authorization Boundary Invariant**: Pengguna hanya dapat membaca dan menulis data di dalam Space tempat mereka terdaftar secara sah di `space_members`. Akses lintas space (*cross-space*) dicegah secara mutlak di level PostgreSQL RLS.
3. **Human-in-the-Loop Invariant**: Notifikasi webhook dan hasil pemindaian OCR **bukan** merupakan transaksi keuangan resmi. Transaksi resmi hanya tercipta setelah ada tindakan persetujuan (*approval*) atau pengiriman form eksplisit oleh pengguna.
4. **Idempotency Invariant**: Satu event notifikasi perbankan dari perangkat yang sama dalam rentang jam yang sama tidak boleh menciptakan lebih dari satu entri di antrean validasi.
5. **No Double-Spending / Double-Approval**: Satu entri validasi berstatus `pending` hanya dapat disetujui satu kali. Percobaan approval ganda secara paralel harus digagalkan secara atomic di level database.
6. **Rejection Permanence**: Notifikasi yang ditolak (*rejected*) tidak boleh berubah menjadi transaksi kas resmi di kemudian hari.
7. **Credential Separation**: Kode undangan (*invite code*) dan token webhook (*webhook token*) adalah dua entitas berbeda dengan siklus hidup berbeda. Kode undangan tidak boleh digunakan untuk mengotentikasi webhook, dan sebaliknya.

---

## 10. UX Principles

1. **Mobile-First Realities**: Antarmuka dioptimalkan untuk pengoperasian satu tangan di smartphone. Tombol-tombol utama dan navigasi diletakkan di area jangkauan jempol (bawah layar).
2. **Calm Financial Utility**: Menghindari animasi berlebihan, efek kilau (*neon glow*), atau ilustrasi abstrak yang tidak relevan. Warna didasarkan pada ketenangan (*slate background*) dengan aksen fungsional hijau (*emerald*) untuk pemasukan dan mawar (*rose*) untuk pengeluaran.
3. **Clear & Unambiguous Figures**: Seluruh angka keuangan diformat menggunakan standar Rupiah Indonesia (`Rp 250.000`), menggunakan font tebal dan kontras tinggi untuk mencegah salah baca.
4. **No AI Slop / Visual Noise**: Tidak menggunakan kartu bergaya bento yang berantakan, gradien ungu generik AI, atau ikon dekoratif tanpa makna fungsional.
5. **Generous Touch Targets**: Semua elemen interaktif (tombol, input, navigasi) memiliki target sentuh minimal **44×44 CSS pixels**.
6. **Explicit Destructive Confirmation**: Tindakan berbahaya seperti menghapus transaksi atau merotasi kunci webhook wajib meminta konfirmasi modal eksplisit sebelum dieksekusi.
7. **Visual Separation of Pending vs Confirmed**: Antrean validasi memiliki identitas visual yang berbeda (ikon lonceng/petir dan lencana kuning/amber) agar pengguna selalu sadar bahwa transaksi tersebut belum resmi masuk ke buku kas.

---

## 11. Privacy & Trust Requirements

1. **Isolasi Data Finansial Pasangan**: Data transaksi tidak pernah diagregasi atau dicampur dengan data pengguna lain di luar Space.
2. **Kerahasiaan Kunci Webhook**: Token webhook disimpan dalam database dalam bentuk hash kriptografis SHA-256 (`webhook_token_hash`). Server tidak pernah menyimpan token dalam bentuk teks biasa. Token plaintext hanya ditampilkan satu kali kepada pengguna saat dibuat atau dirotasi.
3. **Pemberantasan Token di URL**: Token tidak boleh diterima melalui parameter kueri URL (`?key=...`) karena parameter URL rawan bocor ke riwayat browser, log server proxy, dan header Referer.
4. **Zero Financial Data in Browser Cache**: Service Worker dikonfigurasi secara ketat untuk **tidak pernah menyimpan cache permintaan rute HTML, data API, atau respons Supabase**. Hanya aset statis murni (ikon, manifest) yang diizinkan berada di Cache Storage perangkat.
5. **Client-Side Image Processing**: Gambar struk belanja pengguna tidak pernah diunggah ke server penyimpanan (*storage bucket*) atau dianalisis oleh API eksternal. Seluruh pemrosesan OCR terjadi secara luring di memori browser perangkat pengguna.

---

## 12. Success Criteria

| Metrik Keberhasilan | Target | Cara Pengukuran / Sumber Data |
|---|---|---|
| **Waktu Input Manual** | < 15 detik | Dari pembukaan form hingga transaksi tersimpan di dasbor. |
| **Keberhasilan Parser Webhook** | > 95% pada format bank yang didukung | Regex parsing test suite (`scripts/test-parser.mjs`) pada variasi notifikasi BCA, GoPay, ShopeePay, BRImo, BNI, SeaBank. |
| **Integritas Idempotensi Webhook** | 100% duplicate rejection | Percobaan pengiriman payload identik menghasilkan status `ignored` tanpa menambah baris di `pending_validations`. |
| **Konsumsi Biaya Infrastruktur** | Rp0 / Bulan | Tagihan Google Cloud Run, Supabase, dan Cloudflare tetap berada di bawah ambang batas Always Free Tier. |
| **Cold Start Performance (PWA)** | < 2.5 detik pada jaringan 4G | Largest Contentful Paint (LCP) dasbor pada perangkat seluler. |
| **Aksesibilitas Antarmuka** | Zero critical a11y violations | Evaluasi audit kepatuhan WCAG 2.2 AA (kontras warna, label form, aksesibilitas keyboard). |

---

## 13. Product Constraints

1. **Biaya Operasional Rp0**: Tidak boleh mengadopsi layanan berbayar, add-on berbayar, atau API komersial berbasis per-transaksi.
2. **Keterbatasan Lingkungan Serverless (Cloud Run)**: Kontainer dapat mengalami *scale-to-zero*. Penyimpanan lokal kontainer bersifat *ephemeral*. Semua state persisten harus berada di Supabase.
3. **Batasan Kuota Supabase Free Tier**: Ukuran basis data PostgreSQL dibatasi maksimal 500 MB. Skema harus efisien, tidak menyimpan gambar struk dalam database, dan memanfaatkan indexing yang terukur.
4. **Ketiadaan API Bank Resmi**: CelenganKita tidak dapat menggunakan koneksi API Open Banking perbankan langsung. Otomasi sepenuhnya bergantung pada notifikasi push perangkat Android melalui aplikasi pendamping gratis (MacroDroid/Tasker).
5. **Komputasi Ponsel Rendah**: OCR client-side harus membatasi dimensi gambar maksimal (1500px) sebelum pemrosesan Tesseract agar tidak membekukan browser pada ponsel berspesifikasi rendah.

---

## 14. Future Scope (Non-MVP Roadmap)

Fitur-fitur berikut adalah gagasan masa depan yang **bukan** merupakan bagian dari rilis MVP saat ini:
- **Target Anggaran Bulanan per Kategori (*Budget Caps*)**: Menetapkan batas maksimal pengeluaran untuk kategori tertentu (misal: "Makan di Luar: Rp 2.000.000/bulan") disertai bilah progres persentase.
- **Ekspor Laporan Keuangan (CSV/Excel/PDF)**: Kemampuan mengunduh rekap mutasi bulanan untuk arsip pribadi pasangan.
- **Kategori Khusus Kustom Tambahan**: Fasilitas bagi pasangan untuk menambah, mengedit, dan menghapus kategori mandiri di luar kategori bawaan sistem.
- **Pencatatan Tabungan / Celengan Impian (*Savings Goals*)**: Ruang alokasi kas khusus untuk target bersama (misal: "Liburan Akhir Tahun", "DP Rumah").
- **Web Push Notifications**: Notifikasi web langsung ke ponsel saat pasangan baru saja mencatat transaksi atau saat ada antrean validasi baru yang masuk.

---
*Dokumen ini merupakan baseline produk resmi CelenganKita. Segala perubahan fungsional wajib mengacu pada PRD ini.*
