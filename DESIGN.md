# CelenganKita — Design Direction & Product Soul

> **Dokumen Arah Desain & Identitas Visual**  
> Digunakan bersama filter tata kelola `antislop.md` untuk memandu seluruh keputusan UI/UX di CelenganKita.  
> Estetika: **Warm Cozy Couples Sanctuary**, berorientasi mobile-first untuk pasangan di Indonesia.

---

## 1. Product Identity & Soul
* **Nama Produk:** CelenganKita
* **Tujuan Utama:** Aplikasi pencatatan kas bersama dan celengan digital untuk pasangan di Indonesia dengan keterbukaan, privasi terjamin, foto nota belanja otomatis, dan kemudahan pencatatan dari ponsel.
* **Kepribadian (Personality):**
  * **Hangat, Ceria & Menyenangkan (Warm & Welcoming):** Membicarakan keuangan berdua harus terasa nyaman, saling percaya, dan menenangkan hati.
  * **Transparan & Terpercaya (Clear & Honest):** Angka belanjaan dan tabungan disajikan jujur, jelas, dan tanpa bahasa teknis yang membingungkan.
  * **Intim Khusus Berdua (Intimate & Personal):** Dibangun spesial untuk dua insan yang saling mencintai dan membangun masa depan bersama.

---

## 2. Liveliness Dials (Antislop Metrics)
* **ENERGY:** `3 / 5` — Ceria, hangat, dan bersahabat dengan perpaduan warna madu, aprikot, dan koral.
* **RHYTHM:** `2 / 5` — Tata letak rapi, nyaman dipindai mata, kartu bergaris lembut dengan ruang bernapas yang cukup.
* **MOTION:** `1 / 5` — Transisi halus dan cepat (150ms); interaksi taktil saat tombol ditekan tanpa animasi mengganggu.

---

## 3. Color Palette & Semantics (Sesuai Referensi Pengguna)

### A. Palet Utama (The Warm Couples Palette)
* **Butter Cream (`#FFEDB9`):** Aksen kartu, latar chip, dan sentuhan kelembutan.
* **Honey Amber (`#FFCB56`):** Warna madu hangat untuk sorotan dan kartu tabungan bersama.
* **Warm Apricot (`#FFA259`):** Warna aksi utama (*Primary CTA*), tombol penting, dan penanda positif.
* **Coral Rose (`#FF7E7E`):** Warna koral mawar untuk pengeluaran, tab aktif cinta, dan aksen intim.

### B. Kanvas & Permukaan
* **Canvas Background:** `#FFFDF8` (Krem hangat sangat lembut yang nyaman di mata siang maupun malam).
* **Card Surface:** `#FFFFFF` (Putih bersih dengan elevasi lembut).
* **Border Lines:** `#F3ECE2` / `#FFE6A3` (Garis batas hangat 1-pixel tipis yang rapi).
* **Text Colors:**
  * Teks Utama (Headings/Nominal): Deep Warm Espresso `#1C1917` (rasio kontras $> 12:1$ di atas krem/putih, lolos standar WCAG 2.2 AAA).
  * Teks Sekunder (Subtitles/Metadata): Warm Stone `#57534E` / `#78716C` (rasio kontras $> 4.5:1$, lolos WCAG 2.2 AA).

### C. Semantik Finansial
* **Pemasukan (Income):** Aksen Hijau Aprikot Hangat (`#059669` / `#10B981` atau latar `#ECFDF5`) + tanda `+`.
* **Pengeluaran (Expense):** Koral Mawar (`#FF7E7E` / `#E11D48` atau latar `#FFF1F2`) + tanda `-`.
* **Status Tinjauan Belanja:** Madu Hangat (`#FFCB56` / `#D97706` atau latar `#FEF3C7`).

---

## 4. Typography & Human Copywriting
* **Font Family:** Modern Sans-Serif yang ramah (`Inter`, `system-ui`, `-apple-system`).
* **Nominal Finansial:** Menggunakan `tabular-nums` untuk perataan angka rupiah.
* **Aturan Bahasa (No Tech Jargon):**
  * Dilarang menggunakan istilah: `OCR`, `Space`, `Row-Level Security / RLS`, `Webhook`, `SHA-256`, `Mutasi`.
  * Wajib menggunakan istilah manusiawi: `Foto Nota / Struk`, `Celengan Berdua`, `Aman Khusus Berdua`, `Kode Sambungan HP`, `Catatan Belanja`.
