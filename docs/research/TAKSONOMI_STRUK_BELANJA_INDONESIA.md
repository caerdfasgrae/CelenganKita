# LANDASAN TEORETIK: TAKSONOMI STRUK BELANJA DI INDONESIA DAN METODE KEY INFORMATION EXTRACTION (KIE) BERBASIS SPATIAL-KEYWORD ANCHORING SERTA LIGHTWEIGHT LLM

---

## DAFTAR ISI
1. [Pendahuluan & Latar Belakang Masalah](#1-pendahuluan--latar-belakang-masalah)
   - 1.1 Urgensi Dokumen AI pada Finansial Personal & Ritel Indonesia
   - 1.2 Paradigma Visual Document Understanding (VDU) & Key Information Extraction (KIE)
   - 1.3 Kompleksitas Spesifik Domain Dokumen Struk di Indonesia
2. [Karakteristik Fisik Struk Belanja Indonesia](#2-karakteristik-fisik-struk-belanja-indonesia)
   - 2.1 Kertas Dot-Matrix NCR (No Carbon Required / Impact Printing)
   - 2.2 Kertas Thermal POS (Direct Thermal Printing)
   - 2.3 Matriks Perbandingan Komparatif Fisik & Implikasi OCR
3. [Zonasi Dokumen Struk (Spatial Layout Anatomy)](#3-zonasi-dokumen-struk-spatial-layout-anatomy)
   - 3.1 Dekomposisi Tata Letak Vertikal Dokumen Semi-Terstruktur
   - 3.2 Header Zone (Identitas Entitas Usaha & Sesi Transaksi)
   - 3.3 Body Zone (Item Transaksi / Line Items)
   - 3.4 Settlement / Financial Zone (Rekonsiliasi Akuntansi & Pembayaran)
4. [Landasan Teoretis Metode Spatial-Keyword Anchoring](#4-landasan-teoretis-metode-spatial-keyword-anchoring)
   - 4.1 Teori Analisis Tata Letak Dokumen (Document Layout Analysis / DLA)
   - 4.2 Konsep Anchor Leksikal (Lexical Anchors) & Vektor Pencarian Geometris
   - 4.3 Negative Context Filtering & False Positive Rejection
   - 4.4 Evaluasi Kompleksitas Komputasi & Efisiensi Memori Client-Side WASM
5. [Landasan Teoretis Metode Lightweight LLM (Zero-Shot / Few-Shot Semantic KIE)](#5-landasan-teoretis-metode-lightweight-llm-zero-shot--few-shot-semantic-kie)
   - 5.1 Arsitektur Attention-Based Semantic Understanding
   - 5.2 Serialisasi Dokumen 2D-ke-1D & Structured JSON Prompting
   - 5.3 Ketahanan Semantik terhadap Derau Optik (OCR Noise & Typo Tolerance)
6. [Metodologi Pengujian Komparatif](#6-metodologi-pengujian-komparatif)
   - 6.1 Desain Korpus Data Uji (Test Dataset)
   - 6.2 Metrik Evaluasi Akurasi Ekstraksi (P, R, F1, EMR, NLD)
   - 6.3 Metrik Evaluasi Kinerja Sistem (Latensi, Throughput, Cost Footprint, Privasi)
   - 6.4 Matriks Sintesis Trade-Off: Heuristik vs Generatif vs Hibrida
7. [Daftar Pustaka / Referensi Ilmiah Standar](#7-daftar-pustaka--referensi-ilmiah-standar)

---

## 1. PENDAHULUAN & LATAR BELAKANG MASALAH

### 1.1 Urgensi Dokumen AI pada Finansial Personal & Ritel Indonesia
Transformasi digital dalam pengelolaan keuangan mikro—baik pada tataran personal, rumah tangga, maupun Usaha Mikro, Kecil, dan Menengah (UMKM)—sangat bergantung pada efisiensi akuisisi data transaksi (*data ingestion*). Di Indonesia, kendati penetrasi pembayaran nirkontak dan dompet digital berbasis Quick Response Code Indonesian Standard (QRIS) tumbuh eksponensial, struk belanja fisik cetak (*printed paper receipts*) tetap menjadi bukti transaksi hukum primer (*primary physical proof of purchase*) pada transaksi ritel luring (*offline retail*).

Tantangan mendasar timbul ketika pengguna harus melakukan pencatatan manual: friksi operasional yang tinggi mengakibatkan inkonsistensi pencatatan (*record-keeping fatigue*), risiko kesalahan pengetikan manusia (*human entry error*), dan hilangnya visibilitas arus kas secara riil. Otomasi ekstraksi dokumen berbasis kecerdasan buatan (*Document AI*) hadir sebagai jembatan yang mentransformasikan artefak fisik non-terstruktur menjadi data tabular terstruktur.

### 1.2 Paradigma Visual Document Understanding (VDU) & Key Information Extraction (KIE)
Document AI merepresentasikan konvergensi antara *Computer Vision* (CV), *Optical Character Recognition* (OCR), dan *Natural Language Processing* (NLP). Dalam domain pemrosesan dokumen bisnis, disiplin ini diformalkan sebagai *Visual Document Understanding* (VDU). VDU membedakan pemrosesan teks murni dengan pemrosesan dokumen yang tata letak visualnya (*2D visual spatial arrangement*) mengandung bobot semantik inheren.

Tugas inti dalam VDU pada struk belanja adalah *Key Information Extraction* (KIE), yaitu pemetaan dari kumpulan token teks mentah tak beraturan hasil OCR ke dalam relasi kunci-nilai (*key-value pairs*) atau entitas semantik bernama (*Named Entities*), seperti:
$$\mathcal{E} = \{\text{MerchantName}, \text{TransactionDate}, \text{Subtotal}, \text{Tax}, \text{ServiceCharge}, \text{GrandTotal}, \text{PaymentMethod}\}$$

Secara formal, jika dokumen direpresentasikan sebagai himpunan token OCR:
$$\mathcal{T} = \{t_i = (s_i, b_i) \mid i = 1, \dots, N\}$$
di mana $s_i \in \Sigma^*$ adalah string karakter dan $b_i = (x_{1i}, y_{1i}, x_{2i}, y_{2i}) \in \mathbb{R}^4$ adalah koordinat kotak pembatas (*bounding box*), maka fungsi KIE bertujuan memetakan:
$$f_{\text{KIE}}: \mathcal{T} \longrightarrow \mathcal{V}_{\mathcal{E}}$$
di mana $\mathcal{V}_{\mathcal{E}}$ adalah struktur data tervalidasi yang memetakan setiap entitas $e \in \mathcal{E}$ ke nilai konkretnya.

### 1.3 Kompleksitas Spesifik Domain Dokumen Struk di Indonesia
Struk belanja di Indonesia menghadirkan derajat heterogenitas dan entropi visual yang jauh lebih tinggi dibandingkan dengan dokumen standar perkantoran (seperti formulir pajak A4 atau faktur digital PDF):

1. **Variasi Tipografi dan Fenomena Campur Kode (*Code-Mixing*)**:
   Struk belanja di Indonesia lazim menggunakan kombinasi dwibahasa (Bahasa Indonesia dan Bahasa Inggris) dalam satu baris atau antar-baris. Misalnya, kata "Total" berdampingan dengan "Tagihan", "Subtotal" dengan "Jumlah", "Tax" dengan "Pajak / PB1", "Cash" dengan "Tunai", dan "Change" dengan "Kembali".
2. **Konvensi Sistem Moneter Rupiah (IDR)**:
   Mata uang Rupiah memiliki karakteristik tanpa satuan sen dalam peredaran riil, namun format penulisan angka sangat bervariasi:
   - Pemisah ribuan menggunakan tanda titik (`92.400`), koma gaya Anglo-Saxon (`92,400`), atau spasi (`92 400`).
   - Prefiks mata uang bervariasi antara `Rp`, `Rp.`, `IDR`, atau dihilangkan sama sekali.
   - Angka desimal `,00` atau `.00` kadang dicetak oleh sistem POS warisan (*legacy POS*), yang sering kali terpotong atau salah dibaca sebagai angka ribuan tambahan oleh OCR.
3. **Degradasi Geometris dan Lingkungan Nyata (*In-the-Wild Captures*)**:
   Citra struk umumnya ditangkap melalui kamera ponsel pintar di bawah kondisi non-ideal: distorsi perspektif non-planar akibat kertas yang terlipat/lecek (*wrinkling/crumpling*), pencahayaan tidak merata (*shadowing & glare*), serta resolusi optik yang terdegradasi.

---

## 2. KARAKTERISTIK FISIK STRUK BELANJA INDONESIA

Secara fisik, media cetak struk belanja di Indonesia terpolarisasi menjadi dua teknologi pencetakan dominan dengan karakteristik material, mekanis, dan degradasi visual yang bertolak belakang.

```
                  +--------------------------------------------------+
                  |   TAKSONOMI FISIK STRUK BELANJA DI INDONESIA    |
                  +--------------------------------------------------+
                                           |
            +------------------------------+------------------------------+
            |                                                             |
            v                                                             v
+-----------------------+                                     +-----------------------+
|    KERTAS DOT-MATRIX  |                                     |    KERTAS THERMAL POS |
|         (NCR)         |                                     |  (DIRECT THERMAL POS) |
+-----------------------+                                     +-----------------------+
| - Mekanisme: 9/24-pin |                                     | - Mekanisme: Pemanas  |
|   impact ribbon       |                                     |   leuco-dye head      |
| - Media: Pita ungu /  |                                     | - Media: Lapisan      |
|   karbon hitam        |                                     |   termosensitif       |
| - Karakter: Matriks   |                                     | - Karakter: Solid     |
|   titik terputus-putus|                                     |   vektor kontinu      |
| - Resolusi: 72-150 DPI|                                     | - Resolusi: 203 DPI   |
| - Domain: Restoran,   |                                     | - Domain: Indomaret,  |
|   Cafe, Bengkel, UMKM |                                     |   Alfamart, SPBU POS  |
+-----------------------+                                     +-----------------------+
```

### 2.1 Kertas Dot-Matrix NCR (No Carbon Required / Impact Printing)
Teknologi cetak *impact dot-matrix* lazim digunakan pada sektor Food & Beverage (restoran, cafe), bengkel, grosir bahan bangunan, dan UMKM yang memerlukan salinan nota rangkap (*carbonless multi-ply copy paper* seperti rangkap putih-merah-kuning).

#### 2.1.1 Prinsip Kerja Mekanika 9-Pin / 24-Pin Impact Head
Pencetakan dilakukan oleh susunan jarum baja mikro (*pins*) bermotor solenoide yang menumbuk pita kain berpewarna (*ink ribbon*) ke atas permukaan kertas. Printer kasir dot-matrix standar (misalnya seri legendaris Epson TM-U220) memanfaatkan konfigurasi 9-pin vertikal dengan kepadatan rendah.

#### 2.1.2 Karakteristik Visual Mikro: Resolusi Rendah dan Karakter Diskret
Karakter yang dihasilkan bukan berupa garis poligon tertutup yang mulus, melainkan kisi titik-titik diskret (*discrete dot-matrix grid*, lazimnya berukuran $7 \times 9$ atau $9 \times 9$ dots per glif). Jarak antartitik (*inter-dot spacing*) cukup renggang sehingga kontur glif memiliki celah kosong (*non-continuous strokes*).

#### 2.1.3 Dinamika Degradasi Pita Tinta Ungu/Hitam (Ribbon Bleed & Fading)
Pita tinta struk dot-matrix di Indonesia mayoritas menggunakan formulasi pewarna ungu (*violet ribbon*) atau hitam. Karakteristik degradasi pita meliputi:
- **Pita Baru**: Terjadi fenomena *ink bleeding*, di mana tinta merembes ke pori-pori kertas serat kasar, menyebabkan karakter menebal dan sudut-sudut tajam mengalami peleburan (*smudging*).
- **Pita Usang/Kering**: Tinta menipis drastis, intensitas piksel memudar mendekati luminansi latar kertas, dan pin jarum tertentu yang aus menghasilkan garis horizontal kosong permanen di tengah baris teks (*missing dot lines*).

#### 2.1.4 Tantangan Binerisasi Citra (Kegagalan Otsu & Solusi Kontras Adaptif)
Pada prapemrosesan citra standar, algoritma binerisasi global Otsu menghitung ambang batas pemisahan kelas bimodal berdasarkan varians inter-kelas intensitas abu-abu:
$$\sigma_B^2(t) = \omega_0(t)\omega_1(t)[\mu_0(t) - \mu_1(t)]^2$$
Pada kertas dot-matrix dengan pita ungu pudar, histogram citra tidak menunjukkan distribusi bimodal yang tegas. Binerisasi Otsu konvensional memotong titik-titik diskret tersebut sehingga glif terfragmentasi menjadi partikel debu biner (*binary speckle noise*). Angka `'8'` kerap terputus menjadi `'3'` atau `'0'`, dan angka `'7'` kerap tereduksi menjadi `'1'`.

**Solusi Prapemrosesan:**
Penerapan *Dynamic Rescaling* untuk memperbesar tinggi x-karakter (*x-height*) hingga 30–35 piksel, diikuti *Min-Max Contrast Stretching*:
$$I_{\text{out}}(x, y) = \left( \frac{I_{\text{in}}(x, y) - I_{\min}}{I_{\max} - I_{\min}} \right) \times 255$$
yang mempertahankan gradasi intensitas titik matriks sebelum diteruskan ke mesin OCR.

### 2.2 Kertas Thermal POS (Direct Thermal Printing)
Teknologi cetak termal langsung (*direct thermal printing*) adalah standar defakto pada ritel modern terorganisasi di Indonesia, seperti jaringan minimarket (Indomaret, Alfamart, Circle K), supermarket (Super Indo, Transmart), gerai waralaba cepat saji, dan SPBU.

#### 2.2.1 Mekanika Termokimiawi Lapisan Leuco Dye
Kertas termal dilapisi bahan kimia padat yang terdiri atas pewarna nirwarna (*leuco dye*), asam pengembang (*developer*, seperti Bisphenol A atau alternatifnya), dan matriks sensitisator. Kepala cetak termal (*thermal printhead*) terdiri atas barisan elemen pemanas mikro yang memancarkan pulsa panas terkontrol (150°C–200°C). Panas melelehkan matriks, memicu reaksi asam-basa yang mengubah struktur molekul leuco dye menjadi bentuk terkonjugasi yang menyerap spektrum tampak (menghasilkan warna hitam pekat).

#### 2.2.2 Karakteristik Visual: Resolusi 203 DPI dan Ketegasan Cetak
Hasil cetak thermal memiliki resolusi standar 203 DPI (8 dots/mm) dengan kontur karakter kontinu dan rasio kontras awal yang sangat tinggi ($> 90\%$). Hal ini memberikan akurasi penangkapan OCR awal yang sangat superior pada kondisi kertas baru.

#### 2.2.3 Kerentanan Fisik dan Temporal
Kelemahan fatal kertas termal terletak pada instabilitas termokimiawi:
1. **Fotodegradasi dan Termodegradasi**: Reaksi leuco dye bersifat reversibel. Paparan sinar matahari langsung (radiasi UV), panas dompet/kantong (> 40°C), atau kelembapan tinggi menyebabkan teks memudar (*fading*) menjadi abu-abu terang dalam hitungan minggu.
2. **Thermal Blackout**: Jika terpapar sumber panas lokal (misalnya setrika, gesekan kuku intens, atau uap panas), seluruh lapisan reaktif bereaksi secara serentak, menghitamkan seluruh lembar dokumen secara ireversibel.

#### 2.2.4 Fenomena Kerusakan Khas: Dead Pins, Curling, dan Crumpling
- **Printhead Dead Elements**: Kerusakan elemen pemanas individual pada printhead meninggalkan garis putih vertikal tak terbaca sepanjang lembar struk (*vertical dropout line*), yang memotong angka nominal (misal `Rp 100.000` terbaca `Rp 10 .000`).
- **Kelengkungan Roll (*Paper Curling*)**: Efek memori mekanis dari gulungan kertas kecil (diameter 40–50 mm) menyebabkan kertas melengkung secara silindris, memicu distorsi perspektif non-afine saat difoto.
- **Kusut (*Crumpling*)**: Lipatan acak membiaskan pantulan cahaya (*specular reflection*), memicu hilangnya segmen teks di dasar lembah lipatan.

### 2.3 Matriks Perbandingan Komparatif Fisik & Implikasi OCR

| Parameter Evaluasi | Kertas Dot-Matrix NCR | Kertas Thermal POS |
| :--- | :--- | :--- |
| **Prinsip Cetak** | *Impact mechanical* (benturan jarum pita) | *Direct thermal chemical* (pemanas leuco dye) |
| **Media Reaktif** | Tinta cair/pasta ungu (*violet*) atau hitam | Lapisan kimia peka panas pada kertas |
| **Bentuk Glif** | Matriks titik terputus-putus (*discrete grid*) | Garis vektor solid bersambung (*solid strokes*) |
| **Kerapatan Cetak** | Rendah (~72–150 DPI) | Menengah-Tinggi (203 DPI / 8 dot/mm) |
| **Stabilitas Waktu** | Sangat tahan lama (> 5 tahun tanpa pudar) | Rentan pudar drastis (hitungan minggu/bulan) |
| **Kerentanan Suhu** | Kebal panas/gesekan normal | Menghitam (*blackout*) bila terkena panas tinggi |
| **Masalah Khas OCR** | Titik glif putus; binerisasi merusak angka; pita pudar | Garis putih elemen mati (*dead pin*); teks memudar |
| **Prapemrosesan Wajib** | *Min-Max Stretching*, *Upscaling*, Morfologi Dilasi | Koreksi Perspektif (*Dewarping*), *Adaptive Threshold* |
| **Entitas Pengguna** | Restoran, Cafe, Bengkel, UMKM Nota Rangkap | Indomaret, Alfamart, Supermarket, SPBU |

---

## 3. ZONASI DOKUMEN STRUK (SPATIAL LAYOUT ANATOMY)

Secara morfologi tata letak dokumen (*document layout morphology*), struk belanja di Indonesia merupakan dokumen semi-terstruktur yang menganut aliran tata letak vertikal sekuensial (*sequential top-to-bottom layout*).

```
+-------------------------------------------------------------+
|                        HEADER ZONE                          |
|  - Logo / Nama Merchant (e.g. "KOPI KENANGAN MANTAN")       |
|  - Badan Hukum & Cabang (e.g. "PT BUMI BERKAH / KMG-042")    |
|  - Alamat Lengkap & Kontak (e.g. "Telp: 021-5551234")        |
|  - Legalitas Pajak (e.g. "NPWP: 01.234.567.8-012.000")       |
|  - Metadata Transaksi (No. Struk, Tanggal, Kasir, Meja)     |
+=============================================================+
|             --- Separator (Pemisah Titik/Garis) ---         |
+-------------------------------------------------------------+
|                         BODY ZONE                           |
|  [Item Name / Description]         [Qty]  [Price]   [Total] |
|  - AMERICANO LARGE                   1    28.000     28.000 |
|  - CROISSANT BUTTER                  2    22.000     44.000 |
|    *Promo Diskon Member                              -5.000 |
+=============================================================+
|             --- Separator (Pemisah Titik/Garis) ---         |
+-------------------------------------------------------------+
|                  SETTLEMENT / FINANCIAL ZONE                |
|  - SUBTOTAL                                          67.000 |
|  - PB1 / RESTAURANT TAX (10%)                         6.700 |
|  - SERVICE CHARGE (5%)                                3.350 |
|  - PEMBULATAN (ROUNDING)                                -50 |
|  ---------------------------------------------------------- |
|  - GRAND TOTAL / TAGIHAN                             77.000 |
|  - METODE PEMBAYARAN: QRIS BCA                       77.000 |
|    (NMID: ID10200392019, RRN: 9283019283)                   |
|  - BAYAR / CASH                                     100.000 |
|  - KEMBALI / CHANGE                                  23.000 |
+-------------------------------------------------------------+
|                        FOOTER ZONE                          |
|  - Ucapan Terima Kasir, Nomor Call Center, Kebijakan Retur  |
+-------------------------------------------------------------+
```

### 3.1 Dekomposisi Tata Letak Vertikal Dokumen Semi-Terstruktur
Dokumen dapat dimodelkan secara matematis sebagai partisi bidang dua dimensi $\mathbb{R}^2$ menjadi empat zona semantik ortogonal:
$$\mathcal{Z} = \{\mathcal{Z}_{\text{header}}, \mathcal{Z}_{\text{body}}, \mathcal{Z}_{\text{settlement}}, \mathcal{Z}_{\text{footer}}\}$$
di mana setiap zona dibatasi oleh pemisah fisik (*physical separator*) berupa deretan karakter ekuivalen garis (`---`, `===`, `***`) atau spasi vertikal (*whitespace margins*).

### 3.2 Header Zone (Identitas Entitas Usaha & Sesi Transaksi)
Terletak pada koordinat $y$ teratas ($0 \le y < y_{\text{body\_start}}$). Zona ini berfungsi memvalidasi otentisitas dan legalitas merchant.

#### 3.2.1 Atribut Entitas Usaha
- **Nama Dagang (*Brand Name*)**: Umumnya dicetak dengan ukuran font terbesar, huruf kapital tebal (*bold uppercase*), atau di tengah baris (*center-aligned*).
- **Badan Hukum Legal**: Sering kali berbeda dari nama merek (misalnya merek *"Fore Coffee"* berbadan hukum *"PT Terang Anugerah Sejati"*).
- **Identitas Outlet/Cabang**: Kode toko internal minimarket (misal: `"INDOMARET DC CIKARANG T59A"`).

#### 3.2.2 Informasi Kontak dan Legalitas Fiskal
- **Telepon/Faks**: Prefiks penanda mencakup `"Telp:"`, `"Tlp:"`, `"P:"` (*Phone*), `"F:"` (*Fax*), `"WA:"`.
- **Nomor Pokok Wajib Pajak (NPWP)**: Format baku 15 digit (`XX.XXX.XXX.X-XXX.XXX`) atau 16 digit NIK/NPWP terbaru. Nilai ini mengandung angka panjang yang berisiko terdeteksi keliru sebagai nilai transaksi jika tidak difilter secara ketat.

#### 3.2.3 Metadata Sesi Transaksi
- **Stempel Waktu (*Timestamp*)**: Format tanggal Indonesia sangat heterogen (`DD/MM/YYYY`, `DD-MM-YY`, `DD MMM YYYY`), kerap kali digabung dengan jam transaksi (`HH:mm:ss`).
- **Nomor Bukti Transaksi**: `"No. Struk"`, `"Receipt #"`, `"Bill No"`, `"Invoice"`, `"Trx ID"`.
- **Operator Kasir & Sesi Meja**: `"Kasir: Budi"`, `"POS: 01"`, `"Table: 12"`, `"Guest: 4"`.

### 3.3 Body Zone (Item Transaksi / Line Items)
Zona pemuatan rincian komoditas belanja yang memiliki dinamika pengulangan baris (*line item repetition*).

#### 3.3.1 Anatomi Komponen Baris Transaksi
Setiap baris transaksi item mematuhi relasi finansial internal:
$$\text{LineTotal}_k = \text{Quantity}_k \times \text{UnitPrice}_k - \text{LineDiscount}_k$$

#### 3.3.2 Tipologi Tata Letak Baris
1. **Single-Line Record**:
   Nama barang, kuantitas, harga satuan, dan subtotal baris disusun sejajar horizontal:
   `ROTI TAWAR KUPAS    1   16.500   16.500`
2. **Multi-Line Record (Wrapped Layout)**:
   Dominan pada minimarket (Indomaret/Alfamart) untuk mengakomodasi nama barang panjang pada lebar kertas sempit (58mm):
   ```
   INDOMIE GORENG SPESIAL 85G
         2 PCS   x   3.100       6.200
   ```
   Karakteristik ini menuntut algoritma KIE mampu melakukan agregasi baris bertetangga (*neighboring multi-line association*).

### 3.4 Settlement / Financial Zone (Rekonsiliasi Akuntansi & Pembayaran)
Zona paling kritis dalam sistem pencatatan keuangan pribadi. Zona ini memuat rekapitulasi matematis dari seluruh transaksi di atasnya.

#### 3.4.1 Akumulasi Bruto (Subtotal)
Penjumlahan murni dari seluruh $\text{LineTotal}_k$:
$$\text{Subtotal} = \sum_{k=1}^M \text{LineTotal}_k$$
Sering kali ditandai dengan leksikal `"SUBTOTAL"`, `"JUMLAH HARGA"`, atau `"TOTAL PENJUALAN"`.

#### 3.4.2 Perpajakan Indonesia: Pajak Restoran (PB1/PBJT) vs PPN
Sistem perpajakan pada struk di Indonesia memiliki dualisme yuridis:
1. **Pajak Barang dan Jasa Tertentu (PBJT) / PB1 (Pajak Pembangunan 1)**:
   Diterapkan pada sektor F&B (restoran, rumah makan, cafe) sesuai UU No. 1 Tahun 2022 tentang Hubungan Keuangan antara Pemerintah Pusat dan Pemerintahan Daerah (UU HKPD). Tarif umum adalah **10%** dari peredaran bruto (atau subtotal + service charge). Ditandai dengan leksikal `"PB1"`, `"Pajak Daerah"`, `"PBJT"`, `"Tax 10%"`.
2. **Pajak Pertambahan Nilai (PPN)**:
   Diterapkan pada sektor ritel barang umum sesuai UU Harmonisasi Peraturan Perpajakan (UU HPP No. 7 Tahun 2021) dengan tarif **11%** (efektif sejak April 2022). Pada minimarket modern, PPN umumnya bersifat inklusif (*tax-inclusive*), namun tetap dicetak sebagai informasi pemecahan faktur: `"Dasar Pengenaan Pajak (DPP)"` dan `"PPN 11%"`.

#### 3.4.3 Biaya Layanan (*Service Charge*)
Biaya jasa tambahan sebesar 5% hingga 10% yang dikenakan oleh pengelola restoran/hotel sebelum pengenaan pajak daerah.

#### 3.4.4 Pembulatan Finansial (*Cash Rounding Heuristics*)
Fenomena khas Indonesia akibat kelangkaan pecahan uang koin kecil (< Rp 100). Merchant minimarket menerapkan pembulatan otomatis ke atas atau ke bawah terhadap pecahan puluhan Rupiah:
$$\text{Pembulatan} \in [-99, +99]$$
Ditandai dengan leksikal `"PEMBULATAN"`, `"ROUNDING"`, atau simbol minus (`-Rp 25`).

#### 3.4.5 Penentuan Nilai Definitif: Grand Total / Tagihan
Nilai akhir yang menjadi kewajiban mutlak pembeli, didefinisikan sebagai invarian matematis:
$$\text{GrandTotal} = \text{Subtotal} + \text{Pajak} + \text{ServiceCharge} - \text{DiskonGlobal} \pm \text{Pembulatan}$$
Ditandai dengan leksikal berkekuatan tinggi: `"TOTAL"`, `"GRAND TOTAL"`, `"TOTAL AKHIR"`, `"TAGIHAN"`, `"NETTO"`, `"TOTAL BAYAR"`.

#### 3.4.6 Multi-Channel Settlement
- **Tunai (*Cash*)**: Nilai uang fisik yang diserahkan pelanggan.
- **Kartu Debit / Kredit**: Dilengkapi metadata perbankan: `"Approval Code"`, `"Trace No"`, `"TID"`, `"MID"`, dan nomor kartu tersamar (*Masked PAN* `**** **** **** 1234`).
- **QRIS (Quick Response Code Indonesian Standard)**: Memuat Nomor Registrasi Acquirer (NMID) dan *Retrieval Reference Number* (RRN).
- **E-Wallet**: Penanda identitas platform (`"GOPAY"`, `"OVO"`, `"SHOPEEPAY"`, `"DANA"`).

#### 3.4.7 Rekonsiliasi Aliran Kas: Tendered & Change
$$\text{Kembalian (Change)} = \text{Tunai Diterima (Tendered)} - \text{GrandTotal}$$
Kata kunci penanda: `"KEMBALI"`, `"KEMBALIAN"`, `"CHANGE"`. Angka ini tidak boleh tertukar dengan Grand Total.

---

## 4. LANDASAN TEORETIS METODE SPATIAL-KEYWORD ANCHORING

Metode *Spatial-Keyword Anchoring* adalah pendekatan analitik deterministik berbasis aturan geometris (*deterministic rule-based geometric heuristics*) yang mengeksploitasi keteraturan topologis dan leksikal dokumen struk belanja tanpa memerlukan inferensi model saraf berbobot besar.

```
+-----------------------------------------------------------------------------------+
|               PIPELINE METODE SPATIAL-KEYWORD ANCHORING                           |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Raw Image] ---> [Canvas Contrast Stretching] ---> [Tesseract WASM Engine]      |
|                                                              |                    |
|                                                              v                    |
|                                                     [Raw OCR Token Blocks]        |
|                                                              |                    |
|   +----------------------------------------------------------+                    |
|   | Topological Line Clustering & Spatial Sorting (O(N log N))                    |
|   v                                                                               |
|  [Ordered Line Array: (Text, BoundingBox)]                                        |
|   |                                                                               |
|   +---> Phase 1: Lexical Anchor Scoring (TOTAL, GRAND TOTAL, TAGIHAN, JUMLAH)     |
|   |                                                                               |
|   +---> Phase 2: Spatial Search Corridor (Horizontal Right / Bottom Collinear)   |
|   |                                                                               |
|   +---> Phase 3: Negative Context Filtering (Tolak Telp, NPWP, Meja, Barcode)     |
|   |                                                                               |
|   +---> Phase 4: Financial Integrity Validation (GrandTotal >= Max(LineItems))    |
|                                                              |                    |
|                                                              v                    |
|                                                     [Extracted KIE:               |
|                                                      Amount: Rp 77.000,           |
|                                                      Merchant: "Kopi Kenangan"]   |
+-----------------------------------------------------------------------------------+
```

### 4.1 Teori Analisis Tata Letak Dokumen (Document Layout Analysis / DLA)
Analisis Tata Letak Dokumen (DLA) adalah cabang Document AI yang berfokus pada segmentasi visual dan klasifikasi spasial area dokumen ke dalam blok-blok logis (*logical structural blocks*).

#### 4.1.1 Prinsip Kedekatan Geometris Gestalt
Berdasarkan hukum kedekatan (*Law of Proximity*) Gestalt, komponen teks yang berada pada jarak euklidian rendah dalam bidang dua dimensi dipersepsikan memiliki relasi semantik yang kuat. Dalam struk belanja, label kunci semantik (misal `"TOTAL"`) dan nilai numeriknya (misal `"77.000"`) terikat oleh kedekatan sumbu ordinat vertikal ($y$) dan keteraturan penjajaran horizontal ($x$).

#### 4.1.2 Algoritma Segmentasi Spasial
1. **Recursive X-Y Cut (Ha et al., 1995)**:
   Memanfaatkan proyeksi profil proyeksi horizontal $H(y)$ dan vertikal $V(x)$ terhadap koordinat kotak pembatas:
   $$H(y) = \sum_{i=1}^N \mathbb{I}(y_{1i} \le y \le y_{2i})$$
   Lembah kosong (*valleys*) di mana $H(y) = 0$ merepresentasikan batas pemisah baris (*line gutters*).
2. **Document Spectrum / Docstrum (O'Gorman, 1993)**:
   Menghitung distribusi jarak dan orientasi sudut terhadap $k$-tetangga terdekat (*k-Nearest Neighbors*) dari titik pusat komponen terhubung (*connected component centroids*). Docstrum memungkinkan estimasi sudut kemiringan dokumen (*skew angle* $\theta$) dan spasi antar-karakter serta antar-baris secara mandiri dari skala dokumen.

#### 4.1.3 Rekonstruksi Urutan Baca (Reading Order Reconstruction)
Teks hasil OCR mentah sering kali keluar dalam urutan pembacaan yang kacau akibat fragmentasi bounding box. Algoritma melakukan *spatial sorting* leksikografis dengan toleransi batas tinggi baris ($\epsilon_y \approx \frac{1}{2} \text{line\_height}$):
$$(x_a, y_a) \prec (x_b, y_b) \iff (y_a < y_b - \epsilon_y) \lor (|y_a - y_b| \le \epsilon_y \land x_a < x_b)$$

### 4.2 Konsep Anchor Leksikal (Lexical Anchors) & Vektor Pencarian Geometris

#### 4.2.1 Definisi Saliensi Semantik Anchor
*Anchor* leksikal adalah kumpulan token kata kunci berdaya beda tinggi (*high-salience keywords*) yang menjadi jangkar acuan pencarian nilai skalar sasaran.

#### 4.2.2 Kamus Anchor Finansial Indonesia
Kamus dirancang menggunakan pemodelan ekspresi reguler berbobot (*weighted regex dictionary*):
$$\mathcal{K}_{\text{total}} = \left\{ \text{"TOTAL"}, \text{"GRAND TOTAL"}, \text{"TOTAL AKHIR"}, \text{"JUMLAH HARGA"}, \text{"TAGIHAN"}, \text{"TOTAL BAYAR"}, \text{"NETTO"} \right\}$$
$$\mathcal{K}_{\text{tax}} = \left\{ \text{"PB1"}, \text{"PBJT"}, \text{"PAJAK"}, \text{"TAX"}, \text{"PPN"} \right\}$$
$$\mathcal{K}_{\text{subtotal}} = \left\{ \text{"SUBTOTAL"}, \text{"SUB TOTAL"}, \text{"TOTAL PENJUALAN"} \right\}$$
$$\mathcal{K}_{\text{change}} = \left\{ \text{"KEMBALI"}, \text{"KEMBALIAN"}, \text{"CHANGE"} \right\}$$

#### 4.2.3 Vektor Pencarian Spasial (Corridor Search)
Ketika sebuah anchor $t_{\text{anchor}} = (s_a, b_a)$ terdeteksi pada baris $L_j$:
1. **Koridor Horizontal Kanan (*Right-Aligned In-Line Search*)**:
   Nilai numerik berada pada garis horizontal yang sama di sebelah kanan anchor:
   $$\mathcal{C}_{\text{horiz}} = \{ t_k \mid |y_k - y_a| \le \epsilon_y \land x_k > x_{a, \max} \}$$
2. **Koridor Vertikal Bawah (*Below-Aligned Search*)**:
   Jika tidak ditemukan angka di sebelah kanan (akibat line break POS), pencarian dialihkan ke baris berikutnya $L_{j+1}$ tepat di bawah batas horizontal anchor:
   $$\mathcal{C}_{\text{vert}} = \{ t_k \mid y_k > y_{a, \max} \land (y_k - y_{a, \max}) \le 2\epsilon_y \land x_k \approx x_a \}$$

### 4.3 Negative Context Filtering & False Positive Rejection
Kelemahan terbesar pendekatan berbasis pencarian angka sederhana adalah maraknya positif palsu (*false positive traps*). Algoritma wajib menerapkan *Negative Context Filtering*:

1. **Penolakan Prefiks Telekomunikasi & Kontak**:
   Menolak baris atau token angka yang didahului prefiks:
   `/(?:telp|tlp|phone|fax|wa|call|p|f)\s*[:.]?\s*[0-9\-]+/i`
2. **Penolakan Nomor Identitas Fiskal & Pajak**:
   Menolak deretan 15 atau 16 digit angka yang berada dalam kedekatan leksikal dengan kata `"NPWP"` atau `"NPPKP"`.
3. **Penolakan Entitas Sesi & Lokasi Kasir**:
   Mendiskualifikasi angka yang diasosiasikan dengan meja kasir atau transaksi:
   `/(?:meja|table|guest|kasir|cashier|pos|reg|trx|receipt|bill)\s*[:#]?\s*[0-9]+/i`
4. **Penolakan Barcode / SKU / PLU**:
   Nomor barcode produk (EAN-13 berupa 13 digit angka murni, misal `8992753123456`) otomatis ditolak jika tidak memiliki pemisah ribuan titik/koma dan bernilai $> 100.000.000$.
5. **Teorema Validasi Integritas Finansial**:
   Nilai Grand Total yang diekstraksi wajib mematuhi batas bawah matematis terhadap daftar item belanja:
   $$\text{FinalAmount} \ge \max_{k} (\text{LineItem}_k)$$
   Jika kandidat baris "Total" menghasilkan angka yang lebih kecil daripada subtotal atau salah satu item (misal akibat angka digit ratusan ribu terpotong OCR), algoritma secara adaptif beralih ke nilai maksimum valid yang terdeteksi di dokumen.

### 4.4 Evaluasi Kompleksitas Komputasi & Efisiensi Memori Client-Side WASM

#### 4.4.1 Analisis Kompleksitas Waktu Algoritmik
Jika dokumen struk memuat $N$ buah token OCR:
- **Spatial Sorting Token**: Memerlukan pengurutan berbasis koordinat kartesius 2D dengan kompleksitas waktu terburuk:
  $$\mathcal{O}(N \log N)$$
- **Line-Scan Matching**: Pemindaian satu dimensi terhadap $M$ baris terurut ($M \le N$) menggunakan evaluasi ekspresi reguler deterministik:
  $$\mathcal{O}(M) \le \mathcal{O}(N)$$
- **Total Kompleksitas Komputasi**:
  $$\mathcal{T}(N) = \mathcal{O}(N \log N)$$
Untuk struk belanja fisik tipikal di mana $N \le 300$ token, eksekusi line-scan berlangsung dalam durasi sub-milidetik ($< 2 \text{ ms}$) pada CPU perangkat seluler.

#### 4.4.2 Efisiensi Memori pada Client-Side WebAssembly (WASM)
Berbeda dengan model neural network berat yang membutuhkan memori GPU berukuran gigabyte, algoritma heuristik spatial-anchoring dieksekusi langsung di thread browser melalui modul WebAssembly (WASM) Tesseract.js:
- **Runtime Memory Footprint**: $< 45 \text{ MB}$ RAM browser.
- **Server vCPU Overhead**: $0 \text{ detik}$ (komputasi didesentralisasi ke peramban pengguna).
- **Infrastruktur Biaya Server**: Rp 0 per transaksi (*Zero-cost scaling*).

#### 4.4.3 Privasi Data Mutlak (Zero-Server Transmission)
Citra fisik struk belanja memuat data privasi sensitif (lokasi merchant, pola konsumsi harian, 4 digit terakhir kartu perbankan). Pemrosesan lokal di sisi klien menjamin citra dan data mentah tidak pernah meninggalkan peranti pengguna, memenuhi kepatuhan mutlak terhadap **Undang-Undang Pelindungan Data Pribadi (UU No. 27 Tahun 2022)** dan prinsip *Privacy-by-Design*.

---

## 5. LANDASAN TEORETIS METODE LIGHTWEIGHT LLM (ZERO-SHOT / FEW-SHOT SEMANTIC KIE)

Model Bahasa Berukuran Kecil (*Lightweight Large Language Models* atau Small Language Models / SLM) dengan parameter 1B hingga 8B (seperti Phi-3-Mini, Gemma-2-2B, Llama-3.2-3B, atau model multimodal cloud ultra-cepat seperti Gemini 1.5 Flash) membawa paradigma baru dalam pemahaman semantik teks non-linear.

### 5.1 Arsitektur Attention-Based Semantic Understanding
Inti dari LLM adalah arsitektur Transformer yang memanfaatkan mekanisme *Scaled Dot-Product Self-Attention*:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
di mana matriks *Query* ($Q$), *Key* ($K$), dan *Value* ($V$) diproyeksikan dari representasi vektor token. 

Berbeda dengan sistem berbasis aturan yang kaku, mekanisme *Multi-Head Attention* memungkinkan model secara simultan menaruh perhatian pada relasi semantik global: menghubungkan kata "Tagihan Akhir" di dasar dokumen dengan angka nominal di ujung kanan, meskipun terhalang baris kosong atau simbol derau.

#### 5.1.1 Evolusi Model VDU: Dari LayoutLM Menuju LLM Murni
- **LayoutLMv1 / v2 / v3 (Xu et al., 2020-2022)**: Menggabungkan koordinat bounding box visual 2D ($x_0, y_0, x_1, y_1$) ke dalam *positional embedding* Transformer. Membutuhkan fine-tuning supervised yang intensif pada korpus spesifik.
- **Donut (Kim et al., 2022)**: Pendekatan visual murni (*OCR-free*) berbasis Vision Encoder-Decoder (Swin-Transformer + BART). Rentan mengalami halusinasi pada teks numerik kecil.
- **Generative Lightweight LLM**: Menerima hasil OCR sebagai teks mentah semi-terstruktur, memanfaatkan pemahaman semantik inheren (*in-context pretraining*) untuk merekonstruksi makna tanpa memerlukan fine-tuning geometri khusus.

### 5.2 Serialisasi Dokumen 2D-ke-1D & Structured JSON Prompting

#### 5.2.1 Strategi Serialisasi Tata Letak
Agar tata letak visual 2D dapat dipahami oleh arsitektur LLM 1D, dokumen OCR diserialisasikan dengan mempertahankan jeda baris (*newline characters* `\n`) dan tabulasi spasi:
```text
INDOMARET KEMANG TIMUR
JL. KEMANG TIMUR NO. 42
04.09.24-14:30  2.1.48  KSR:SITI
================================
INDOMIE GOR SPCL 85G
   2  x  3.100           6.200
ULTRA MILK COKLAT 200ML
   1  x  5.500           5.500
--------------------------------
TOTAL BELANJA           11.700
TUNAI                   20.000
KEMBALIAN                8.300
```

#### 5.2.2 Structured JSON Prompting & Schema-Constrained Decoding
Untuk menjamin determinisme luaran sistem dalam lingkungan produksi, LLM diinstruksikan menghasilkan luaran yang tervalidasi terhadap skema JSON formal (misalnya menggunakan skema Zod atau JSON Schema).

```json
{
  "merchant_name": "string",
  "transaction_date": "string (ISO 8601 YYYY-MM-DD)",
  "subtotal": "number",
  "tax_amount": "number",
  "service_charge": "number",
  "grand_total": "number",
  "payment_method": "string (CASH | DEBIT | CREDIT | QRIS | EWALLET)",
  "line_items": [
    {
      "item_name": "string",
      "quantity": "number",
      "unit_price": "number",
      "line_total": "number"
    }
  ]
}
```

#### 5.2.3 Prompting Zero-Shot vs Few-Shot In-Context Learning
- **Zero-Shot Prompting**: Mengandalkan instruksi sistem (*system prompt*) yang ketat dengan deskripsi aturan pajak Indonesia (PB1 10%, pemisah ribuan titik).
- **Few-Shot Prompting**: Menyertakan 2 atau 3 pasang contoh konkret (*exemplars*) struk riil Indonesia (struk dot-matrix restoran padang dengan PB1 dan struk minimarket dengan diskon) dalam konteks percakapan untuk menuntun penanganan ambiguitas leksikal.

### 5.3 Ketahanan Semantik terhadap Derau Optik (OCR Noise & Typo Tolerance)
Kekuatan terbesar LLM dibandingkan metode heuristik terletak pada kemampuan *Sub-word Tokenization* (misalnya Byte-Pair Encoding / BPE) dan representasi ruang laten semantik (*semantic embedding space*).

#### 5.3.1 Rekonstruksi Karakter Cacat (*Character Confusion Matrix*)
Ketika OCR salah membaca karakter fisik akibat pita dot-matrix aus:
- `"T0TAL"` direkonstruksi menjadi `"TOTAL"`
- `"GRND T0T4L"` direkonstruksi menjadi `"GRAND TOTAL"`
- `"P81"` atau `"PB I"` direkonstruksi menjadi `"PB1 (Pajak Restoran)"`
- Angka `"92.4OO"` (huruf O kapital alih-alih angka nol) secara otomatis dinormalisasi menjadi integer `92400`.

#### 5.3.2 Verifikasi Konsistensi Aritmetika Mandiri (*Self-Consistency Chain*)
LLM mampu melakukan penalaran aritmetika internal untuk memverifikasi kebenaran ekstraksi:
$$\text{Jika } \sum \text{items} = 50.000 \land \text{PB1}(10\%) = 5.000 \implies \text{Total} = 55.000$$
Jika angka pada baris Total di struk memudar atau terpotong sebagian (`5?.000`), LLM dapat mendeduksi nilai yang hilang secara probabilistik berdasarkan jumlah komponen biaya lainnya.

---

## 6. METODOLOGI PENGUJIAN KOMPARATIF

Untuk menguji kinerja dan kelayakan teoritis antara metode *Spatial-Keyword Anchoring* dan *Lightweight LLM*, disusun protokol evaluasi ilmiah berbasis standar benchmarking Document AI internasional.

### 6.1 Desain Korpus Data Uji (Test Dataset)
Korpus pengujian dibangun dengan mereplikasi distribusi dunia nyata struk belanja di Indonesia, mengacu pada rancangan dataset standar internasional seperti **CORD (Consolidated Receipt Dataset for Post-OCR Parsing)** oleh Naver Clova yang berbasis struk Indonesia, serta **SROIE (Scanned Receipts OCR and Information Extraction)** ICDAR 2019.

```
+-------------------------------------------------------------------------------+
|                    DISTRIBUSI DATASET UJI KOMPARATIF (N = 500)                |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [Kertas Dot-Matrix NCR: 250 Struk]       [Kertas Thermal POS: 250 Struk]     |
|  - Restoran / Cafe (125)                  - Minimarket Modern (125)           |
|    (Fitur: PB1 10%, Service Charge 5%)      (Fitur: Multi-line, Diskon promo) |
|  - UMKM / Bengkel / Grosir (125)          - Supermarket / F&B Fastfood (125)  |
|    (Fitur: Pita aus, tulisan miring)        (Fitur: Kertas pudar, kusut)      |
|                                                                               |
|  Kondisi Tangkapan:                                                           |
|  - Ideal Flat Scan: 30%                                                       |
|  - Kamera Ponsel Bersudut (Perspective Skew): 40%                             |
|  - Pencahayaan Rendah / Bayangan Ponsel (Low-light Shadowed): 30%             |
+-------------------------------------------------------------------------------+
```

### 6.2 Metrik Evaluasi Akurasi Ekstraksi Informasi

#### 6.2.1 Precision, Recall, dan F1-Score Tingkat Entitas
Dihitung untuk setiap entitas target $e \in \mathcal{E}$:
$$\text{Precision} (P) = \frac{TP}{TP + FP}, \quad \text{Recall} (R) = \frac{TP}{TP + FN}$$
$$F_1\text{-Score} = 2 \times \frac{P \times R}{P + R}$$
- **True Positive (TP)**: Entitas diekstraksi dengan nilai yang identik terhadap ground truth.
- **False Positive (FP)**: Nilai diekstraksi salah atau diekstraksi padahal entitas tidak ada di dokumen.
- **False Negative (FN)**: Entitas ada di dokumen fisik namun gagal diekstraksi oleh sistem.

#### 6.2.2 Exact Match Rate (EMR)
Metrik evaluasi biner tanpa toleransi deviasi untuk field finansial numerik (Total, Subtotal, Pajak):
$$\text{EMR} = \frac{1}{M} \sum_{i=1}^M \mathbb{I}(y_{\text{pred}}^{(i)} = y_{\text{true}}^{(i)})$$
di mana $\mathbb{I}(\cdot)$ bernilai 1 jika nilai prediksi cocok persis dengan ground truth tanpa selisih Rp 1 pun, dan 0 jika terdapat perbedaan.

#### 6.2.3 Normalized Levenshtein Distance (NLD) untuk Merchant
Untuk mengukur akurasi ekstraksi string nama toko yang rentan typo OCR:
$$\text{NLS}(s_1, s_2) = 1 - \frac{\text{Levenshtein}(s_1, s_2)}{\max(|s_1|, |s_2|)}$$

### 6.3 Metrik Evaluasi Kinerja Sistem & Infrastruktur

1. **Latensi End-to-End ($t_{\text{total}}$)**:
   $$t_{\text{total}} = t_{\text{preprocessing}} + t_{\text{ocr}} + t_{\text{kie}}$$
   Diukur dalam satuan milidetik (ms) pada lingkungan perangkat keras seluler terkendali (misal: perangkat Android kelas menengah dengan CPU ARM Cortex-A78).
2. **Throughput Komputasi**:
   Jumlah dokumen yang mampu diproses per detik (*Transactions Per Second* / TPS).
3. **Cost Footprint Finansial**:
   Biaya operasional infrastruktur per 10.000 pemrosesan transaksi struk:
   $$\text{Biaya Server} = \text{Biaya Cloud LLM API} + \text{Biaya vCPU Processing}$$
4. **Konsumsi Bandwidth Jaringan**:
   Volume data yang harus ditransmisikan melintasi jaringan internet (KB per dokumen).

### 6.4 Matriks Sintesis Trade-Off: Heuristik vs Generatif vs Hibrida

| Parameter Komparatif | Spatial-Keyword Anchoring (Heuristik) | Lightweight LLM (Generatif) | Hibrida (Cascading Architecture) |
| :--- | :--- | :--- | :--- |
| **Akurasi Grand Total (Kondisi Bersih)** | Sangat Tinggi ($> 94\%$) | Sangat Tinggi ($> 96\%$) | Maksimal ($> 98\%$) |
| **Akurasi Struk Rusak / OCR Typo** | Sedang (~$70\% - 75\%$) | Unggul ($> 90\%$) | Unggul ($> 92\%$) |
| **Akurasi Ekstraksi Item List** | Terbatas pada format tabular kaku | Sangat adaptif terhadap multi-line | Sangat adaptif |
| **Latensi Inferensi KIE** | Ultra-Cepat ($< 5 \text{ ms}$) | Sedang-Lambat ($800 - 2500 \text{ ms}$) | Adaptif ($5 \text{ ms}$ mode cepat) |
| **Lokasi Eksekusi** | 100% Client-Side Browser (WASM) | Cloud Server API atau On-Device SLM | Client-side first, Cloud fallback |
| **Biaya Infrastruktur (Cost/10k)** | **Rp 0 (Always Free)** | $ 1.00 - $ 15.00 (Tergantung Model) | Sangat Rendah (< $ 0.50) |
| **Privasi Pengguna (Data Privacy)** | Mutlak (Zero server transmission) | Memerlukan transmisi teks ke cloud | Mutlak untuk jalur lokal |
| **Kebutuhan Memori Runtime** | Sangat Rendah (< 50 MB) | Tinggi (Cloud API) / Ekstrem (On-Device SLM) | Rendah (< 50 MB) |
| **Ketergantungan Internet** | Bekerja 100% Offline | Wajib koneksi internet aktif | Offline-first, online opsional |

---

## 7. DAFTAR PUSTAKA / REFERENSI ILMIAH STANDAR

1. **Huang, Z., Chen, K., He, J., Bai, X., Karatzas, D., Lu, S., & Jawahar, C. V.** (2019). *ICDAR2019 Competition on Scanned Receipt OCR and Information Extraction (SROIE)*. In 2019 International Conference on Document Analysis and Recognition (ICDAR), pp. 1516–1520. IEEE. https://doi.org/10.1109/ICDAR.2019.00244
2. **Park, S., Shin, S., Lee, B., Lee, J., Surh, J., Seo, M., & Lee, H.** (2019). *CORD: A Consolidated Receipt Dataset for Post-OCR Parsing*. In Document Intelligence Workshop at Conference on Neural Information Processing Systems (NeurIPS 2019). Vancouver, Canada.
3. **O'Gorman, L.** (1993). *The Document Spectrum for Structural Analysis of Inhomogeneous Text Documents*. IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI), 15(11), pp. 1162–1173. https://doi.org/10.1109/34.244677
4. **Ha, J., Haralick, R. M., & Phillips, I. T.** (1995). *Recursive X-Y Cut using Bounding Boxes of Connected Components*. In Proceedings of the Third International Conference on Document Analysis and Recognition (ICDAR 1995), Vol. 2, pp. 1052–1055. IEEE.
5. **Xu, Y., Li, M., Cui, L., Huang, S., Wei, F., & Zhou, M.** (2020). *LayoutLM: Pre-training of Text and Layout for Document Image Understanding*. In Proceedings of the 26th ACM SIGKDD International Conference on Knowledge Discovery & Data Mining (KDD '20), pp. 1192–1200. https://doi.org/10.1145/3394486.3403172
6. **Xu, Y., Xu, Y., Lv, T., Cui, L., Wei, F., Wang, G., Lu, Y., Dinev, D., Wang, Y., Shao, N., & Chen, J.** (2021). *LayoutLMv2: Multi-modal Pre-training for Visually-Rich Document Understanding*. In Proceedings of the 59th Annual Meeting of the Association for Computational Linguistics (ACL 2021), pp. 2579–2591.
7. **Huang, Y., Lv, T., Cui, L., Lu, Y., & Wei, F.** (2022). *LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking*. In Proceedings of the 30th ACM International Conference on Multimedia (MM '22), pp. 4083–4091.
8. **Kim, G., Hong, T., Yim, M., Nam, J., Park, J., Yim, J., Hwang, W., Yun, S., Han, D., & Park, S.** (2022). *OCR-free Document Understanding Transformer (Donut)*. In European Conference on Computer Vision (ECCV 2022), pp. 498–517. Springer, Cham.
9. **Hong, T., Kim, D., Ji, M., Hwang, W., Nam, J., & Park, S.** (2022). *BROS: A Pre-trained Language Model Focusing on Text and Layout for Better Key Information Extraction from Documents*. In Proceedings of the AAAI Conference on Artificial Intelligence, 36(10), pp. 10767–10775.
10. **Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I.** (2017). *Attention Is All You Need*. In Advances in Neural Information Processing Systems (NeurIPS 2017), Vol. 30, pp. 5998–6008.
11. **Smith, R.** (2007). *An Overview of the Tesseract OCR Engine*. In Ninth International Conference on Document Analysis and Recognition (ICDAR 2007), Vol. 2, pp. 629–633. IEEE.
12. **Otsu, N.** (1979). *A Threshold Selection Method from Gray-Level Histograms*. IEEE Transactions on Systems, Man, and Cybernetics, 9(1), pp. 62–66. https://doi.org/10.1109/TSMC.1979.4310076
13. **Republik Indonesia.** (2022). *Undang-Undang Republik Indonesia Nomor 1 Tahun 2022 tentang Hubungan Keuangan antara Pemerintah Pusat dan Pemerintahan Daerah (UU HKPD)*. Lembaran Negara Republik Indonesia Tahun 2022 Nomor 4. Jakarta: Sekretariat Negara.
14. **Republik Indonesia.** (2021). *Undang-Undang Republik Indonesia Nomor 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (UU HPP)*. Lembaran Negara Republik Indonesia Tahun 2021 Nomor 246. Jakarta: Sekretariat Negara.
15. **Republik Indonesia.** (2022). *Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)*. Lembaran Negara Republik Indonesia Tahun 2022 Nomor 196. Jakarta: Sekretariat Negara.
