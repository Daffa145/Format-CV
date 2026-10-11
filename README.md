# TalentScan - Batch PDF CV to Structured Excel, CSV & Web Dashboard

Sistem otomatisasi untuk memproses batch ratusan dokumen CV (Curriculum Vitae) berformat PDF menjadi data terstruktur (Excel `.xlsx`, CSV `.csv`, dan Web Dashboard Next.js) dengan kolom subjudul terpisah:
- **Pengalaman Kerja & Magang**
- **Riwayat Pendidikan & Akademik**
- **Keahlian & Keterampilan**
- **Kemampuan Bahasa**
- **Pengalaman Organisasi**
- **Prestasi & Sertifikasi**
- **Profil & Data Pribadi**

---

## 1. Fitur Utama

1. **Batch PDF Processing**:
   - Memindai seluruh file PDF di folder `input_pdf/`.
   - Error handling tangguh (`try-except`), dokumen corrupt/rusak tidak membuat proses berhenti.
   - Deteksi tabel otomatis dan fallback ekstraksi teks bebas.

2. **Ekspor Excel & CSV Bersubjudul (1 File = Seluruh Data)**:
   - Menghasilkan file Excel master `.xlsx` (dilengkapi styling warna status hijau/kuning/merah, font Segoe UI, wrap text, dan freeze panes).
   - Menghasilkan file CSV master `.csv` dengan encoding `utf-8-sig` (kompatibel langsung dengan Microsoft Excel).
   - Poin-poin rincian terstruktur (`•`).

3. **Web Dashboard Clean Light (Next.js 14)**:
   - Portal interaktif untuk melihat seluruh kandidat pelamar.
   - Statistik real-time (Tabel terstruktur, teks bebas, corrupt).
   - Pencarian instan (nama, kontak, keahlian) dan filter status.
   - Modal detail CV dengan tampilan subjudul bersih dan salin kontak cepat.
   - Tombol unduh 1-klik untuk mengunduh master Excel dan CSV.
   - Siap dideploy langsung ke **Vercel**.

---

## 2. Struktur Proyek

```text
├── input_pdf/                 # Folder kumpulan file CV PDF (100 dokumen)
├── output_csv/                # Folder hasil konversi Excel (.xlsx) & CSV (.csv)
├── web-dashboard/             # Aplikasi Web Dashboard (Next.js 14)
│   ├── src/app/               # App Router & API Routes
│   │   ├── api/download/      # Endpoint download resmi
│   │   ├── page.js            # Komponen halaman utama dashboard
│   │   └── globals.css        # Styling tema clean light
│   └── public/                # Static assets, template file & data JSON
├── pdf_to_csv_converter.py    # Skrip konversi batch PDF utama
├── generate_subjudul_rekap.py # Skrip parser subjudul dan generator Excel/CSV
├── requirements.txt           # Dependensi Python
└── README.md
```

---

## 3. Instalasi & Penggunaan

### A. Menjalankan Skrip Python
1. Instal dependensi:
   ```bash
   pip install -r requirements.txt
   ```
2. Jalankan konverter:
   ```bash
   python pdf_to_csv_converter.py
   # atau untuk generate ulang rekap bersubjudul:
   python generate_subjudul_rekap.py
   ```
3. Hasil otomatis tersimpan di folder `output_csv/` dan folder `web-dashboard/public/`.

### B. Menjalankan Web Dashboard (Next.js)
1. Masuk ke folder dashboard dan instal dependensi Node:
   ```bash
   cd web-dashboard
   npm install
   ```
2. Jalankan server lokal:
   ```bash
   npm run dev
   ```
3. Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 4. Lisensi & Kontributor
Dibuat oleh **Daffa145** untuk rekapitulasi data pelamar kerja secara otomatis.
