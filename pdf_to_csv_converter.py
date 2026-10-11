# ==============================================================================
# PROGRAM BATCH PDF TO EXCEL & CSV (1 FILE = 1 BARIS RAPI)
# Dibuat oleh: Senior Python Developer
#
# Spesifikasi Baru:
# 1. 1 Baris = 1 Pelamar / Dokumen PDF (Total pas ~100 baris ke bawah)
# 2. Tidak dipecah menjadi ribuan baris terpisah
# 3. Kolom ringkas & informatif:
#    - No
#    - Nama Pelamar
#    - Status Dokumen (Highlight Warna: Hijau/Kuning/Merah)
#    - Email
#    - No. Telepon / WA
#    - Rincian Lengkap CV (Semua teks/tabel digabung rapi dalam 1 sel)
#    - Keterangan / Info Dokumen
#    - Nama File PDF
# 4. Error handling tetap aktif (file corrupt tidak crash dan tetap masuk rekap)
# ==============================================================================

import os
import sys
import re
import csv
import pdfplumber
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from generate_subjudul_rekap import parse_cv_ke_subjudul, format_bullet_points

# Memastikan terminal Windows mendukung output encoding UTF-8
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def bersihkan_nama_pelamar(nama_file, teks_pertama=""):
    """
    Membersihkan nama pelamar dari nama file atau baris pertama dokumen.
    Contoh: 'CV - SALMA AGUSTIANA.pdf' -> 'Salma Agustiana'
            '1655706752225_CV_...pdf' -> diambil dari teks pertama jika nama file adalah angka/hash
    """
    nama_dasar = os.path.splitext(nama_file)[0]
    
    # Hapus ekstensi ganda jika ada (misal .pdf.pdf)
    if nama_dasar.lower().endswith(".pdf"):
        nama_dasar = os.path.splitext(nama_dasar)[0]

    # Bersihkan pola umum prefix / suffix nama file
    pola_bersih = [
        r"^CV\s*[-_]?\s*",
        r"^Curriculum\s*Vitae\s*[-_]?\s*",
        r"^BERKAS\s*AN\s*",
        r"_KitaLulusCV.*$",
        r"_RM Funding.*$",
        r"_TL Funding.*$",
        r"_RPP KUDUS.*$",
        r"_CV terbaru.*$",
        r"-dikonversi.*$",
        r"\s*new.*$",
        r"\s*terbaru.*$",
    ]
    
    nama_bersih = nama_dasar
    for pola in pola_bersih:
        nama_bersih = re.sub(pola, "", nama_bersih, flags=re.IGNORECASE).strip()

    # Jika nama file didominasi angka / timestamp (seperti 1655706752225_CV_...)
    hanya_angka = re.sub(r"[^0-9]", "", nama_bersih)
    if len(hanya_angka) > 10 and teks_pertama:
        # Ambil baris pertama dari teks dokumen yang bukan kosong
        baris_pertama = teks_pertama.strip().split("\n")[0].strip()
        if baris_pertama and len(baris_pertama) < 50:
            return baris_pertama.title()

    # Rapikan format spasi dan huruf besar/kecil
    nama_bersih = nama_bersih.replace("-", " ").replace("_", " ")
    nama_bersih = re.sub(r"\s+", " ", nama_bersih).strip()
    return nama_bersih.title() if nama_bersih else nama_dasar


def ekstrak_kontak(teks_lengkap):
    """Mengekstrak alamat email dan nomor telepon dari teks menggunakan Regular Expression."""
    # Ekstraksi email
    daftar_email = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", teks_lengkap)
    email_unik = []
    for em in daftar_email:
        em_bersih = em.strip(".,;:").lower()
        if em_bersih not in email_unik:
            email_unik.append(em_bersih)
    email_hasil = "\n".join(email_unik) if email_unik else "-"

    # Ekstraksi nomor HP / WhatsApp Indonesia (+62 / 62 / 08...)
    daftar_hp = re.findall(r"(?:(?:\+62|62|08)[0-9\s-]{8,15})", teks_lengkap)
    hp_unik = []
    for hp in daftar_hp:
        # Bersihkan spasi atau tanda hubung untuk verifikasi panjang
        digit_saja = re.sub(r"[^0-9]", "", hp)
        if 9 <= len(digit_saja) <= 14:
            hp_bersih = hp.strip(".,;:- ")
            if hp_bersih not in hp_unik:
                hp_unik.append(hp_bersih)
    hp_hasil = "\n".join(hp_unik[:2]) if hp_unik else "-"  # Maksimal 2 nomor utama

    return email_hasil, hp_hasil


def baca_dan_rangkum_pdf(path_file_pdf):
    """
    Membaca 1 file PDF secara menyeluruh dan mengembalikan:
    - tipe_data: 'TABEL', 'TEKS', 'KOSONG'
    - total_halaman: int
    - teks_gabungan: str (seluruh teks/tabel yang dirangkum rapi)
    """
    isi_tabel_list = []
    isi_teks_list = []
    total_halaman = 0

    with pdfplumber.open(path_file_pdf) as pdf:
        total_halaman = len(pdf.pages)
        for nomor_halaman, halaman in enumerate(pdf.pages, start=1):
            # 1. Coba ekstrak tabel
            tabel_halaman = halaman.extract_tables()
            if tabel_halaman:
                for tabel in tabel_halaman:
                    for baris in tabel:
                        baris_bersih = [
                            sel.strip().replace("\n", " ") if sel is not None else ""
                            for sel in baris
                        ]
                        if any(baris_bersih):
                            isi_tabel_list.append(" | ".join([b for b in baris_bersih if b]))

            # 2. Ekstrak teks biasa
            teks_hal = halaman.extract_text()
            if teks_hal:
                for baris in teks_hal.split("\n"):
                    b_bersih = baris.strip()
                    if b_bersih:
                        isi_teks_list.append(b_bersih)

    # Tentukan tipe data
    if isi_tabel_list:
        tipe_data = "TABEL"
        # Rangkum tabel menjadi teks terstruktur rapi
        teks_gabungan = "\n".join(isi_tabel_list)
        # Jika teks biasa punya informasi tambahan di luar tabel, sertakan pula
        if len(isi_teks_list) > len(isi_tabel_list):
            teks_gabungan = "\n".join(isi_teks_list)
    elif isi_teks_list:
        tipe_data = "TEKS"
        teks_gabungan = "\n".join(isi_teks_list)
    else:
        tipe_data = "KOSONG"
        teks_gabungan = "[File tidak memiliki teks terbaca / berupa scan gambar tanpa OCR]"

    return tipe_data, total_halaman, teks_gabungan


def buat_rekap_rapi(folder_input="input_pdf", folder_output="output_csv"):
    """
    Fungsi utama untuk membuat 1 baris per 1 pelamar (Total pas ~100 baris ke bawah).
    Menghasilkan:
    1. output_csv/rekap_pelamar_cv.xlsx (Excel Rapi Berwarna)
    2. output_csv/rekap_pelamar_cv.csv  (CSV Rapi)
    """
    print("=" * 75)
    print("     GENERATOR REKAP CV: 1 PELAMAR = 1 BARIS RAPI (EXCEL & CSV)")
    print("=" * 75)

    if not os.path.exists(folder_input):
        os.makedirs(folder_input)
    if not os.path.exists(folder_output):
        os.makedirs(folder_output)

    semua_file = os.listdir(folder_input)
    daftar_pdf = [f for f in semua_file if f.lower().endswith(".pdf")]
    total_file = len(daftar_pdf)

    if total_file == 0:
        print(f"[PERINGATAN] Folder '{folder_input}/' masih kosong.")
        return

    print(f"[INFO] Memproses {total_file} file PDF menjadi {total_file} baris data ke bawah...\n" + "-" * 75)

    rekap_baris = []
    stat_tabel = 0
    stat_teks = 0
    stat_corrupt = 0

    for indeks, nama_file in enumerate(daftar_pdf, start=1):
        path_pdf = os.path.join(folder_input, nama_file)
        print(f"[{indeks}/{total_file}] Membaca: {nama_file} ...", end=" ", flush=True)

        try:
            tipe, total_hal, teks_lengkap = baca_dan_rangkum_pdf(path_pdf)
            nama_pelamar = bersihkan_nama_pelamar(nama_file, teks_lengkap)
            email, no_hp = ekstrak_kontak(teks_lengkap)

            if tipe == "TABEL":
                status = "SUKSES (TABEL)"
                ket = f"Tabel Terdeteksi ({total_hal} Halaman)"
                stat_tabel += 1
                print(f"[SUKSES TABEL]")
            elif tipe == "TEKS":
                status = "TANPA TABEL (TEKS BEBAS)"
                ket = f"Teks Bebas / CV ({total_hal} Halaman)"
                stat_teks += 1
                print(f"[TEKS BEBAS]")
            else:
                status = "TANPA TABEL (KOSONG / SCAN)"
                ket = f"Scan / Gambar ({total_hal} Halaman)"
                stat_teks += 1
                print(f"[KOSONG/SCAN]")

            # Ekstrak subjudul
            sections = parse_cv_ke_subjudul(teks_lengkap)
            if "SCAN" in sections:
                exp_text = "-"
                edu_text = "-"
                skills_text = "-"
                lang_text = "-"
                org_text = "-"
                ach_text = "-"
                prof_text = "[Dokumen hasil scan gambar / tanpa teks digital OCR]"
            else:
                exp_text = format_bullet_points(sections.get("EXPERIENCE", []))
                edu_text = format_bullet_points(sections.get("EDUCATION", []))
                skills_text = format_bullet_points(sections.get("SKILLS", []))
                lang_text = format_bullet_points(sections.get("LANGUAGES", []))
                org_text = format_bullet_points(sections.get("ORGANIZATION", []))
                ach_text = format_bullet_points(sections.get("ACHIEVEMENTS", []))
                prof_text = format_bullet_points(sections.get("PROFILE", []))

            rekap_baris.append([
                indeks,
                nama_pelamar,
                status,
                email,
                no_hp,
                exp_text,
                edu_text,
                skills_text,
                lang_text,
                org_text,
                ach_text,
                prof_text,
                ket,
                nama_file
            ])

        except Exception as err:
            stat_corrupt += 1
            print(f"[GAGAL / CORRUPT]")
            nama_pelamar = bersihkan_nama_pelamar(nama_file)
            rekap_baris.append([
                indeks,
                nama_pelamar,
                "CORRUPT / ERROR",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                f"File rusak / gagal dibaca: {type(err).__name__} - {str(err)}",
                f"ERROR: {type(err).__name__}",
                nama_file
            ])

    print("-" * 75)
    print("Menyusun file Excel & CSV yang rapi dengan subjudul...")

    headers = [
        "No", 
        "Nama Pelamar", 
        "Status Dokumen", 
        "Email", 
        "No. Telepon / WA", 
        "Pengalaman Kerja & Magang",
        "Riwayat Pendidikan & Akademik",
        "Keahlian & Keterampilan",
        "Kemampuan Bahasa",
        "Pengalaman Organisasi",
        "Prestasi & Sertifikasi",
        "Profil & Data Pribadi",
        "Keterangan Dokumen", 
        "Nama File PDF Asli"
    ]

    # =========================================================================
    # 1. GENERATE EXCEL RAPI BERWARNA (.XLSX)
    # =========================================================================
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Rekap CV Bersubjudul"

    # Tulis Header
    ws.append(headers)

    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    border_tipis = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    ws.row_dimensions[1].height = 32
    for col_idx in range(1, len(headers) + 1):
        c = ws.cell(row=1, column=col_idx)
        c.fill = header_fill
        c.font = header_font
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Warna Status
    fill_hijau = PatternFill(start_color="ECFDF5", end_color="ECFDF5", fill_type="solid")
    font_hijau = Font(name="Segoe UI", size=10, color="065F46", bold=True)

    fill_kuning = PatternFill(start_color="FFFBEB", end_color="FFFBEB", fill_type="solid")
    font_kuning = Font(name="Segoe UI", size=10, color="92400E", bold=True)

    fill_merah = PatternFill(start_color="FEF2F2", end_color="FEF2F2", fill_type="solid")
    font_merah = Font(name="Segoe UI", size=10, color="991B1B", bold=True)

    font_data = Font(name="Segoe UI", size=10, color="1E293B")
    font_nama = Font(name="Segoe UI", size=10, bold=True, color="0F172A")

    for baris_idx, data in enumerate(rekap_baris, start=2):
        ws.append(data)
        ws.row_dimensions[baris_idx].height = 55  # Tinggi baris nyaman untuk poin-poin

        status_teks = str(data[2])

        # Formatting tiap sel
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=baris_idx, column=col_idx)
            cell.border = border_tipis
            cell.font = font_data
            cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

            if col_idx == 1:  # No
                cell.alignment = Alignment(horizontal="center", vertical="top")
            elif col_idx == 2:  # Nama Pelamar
                cell.font = font_nama
            elif col_idx == 3:  # Status Dokumen
                cell.alignment = Alignment(horizontal="center", vertical="top")
                if "SUKSES" in status_teks:
                    cell.fill = fill_hijau
                    cell.font = font_hijau
                elif "TANPA TABEL" in status_teks:
                    cell.fill = fill_kuning
                    cell.font = font_kuning
                elif "CORRUPT" in status_teks or "ERROR" in status_teks:
                    cell.fill = fill_merah
                    cell.font = font_merah

        # Jika Corrupt / Error, beri latar merah lembut di seluruh baris agar mencolok
        if "CORRUPT" in status_teks or "ERROR" in status_teks:
            for col_idx in range(1, len(headers) + 1):
                ws.cell(row=baris_idx, column=col_idx).fill = fill_merah

    # Pengaturan Lebar Kolom yang Pas & Rapi
    lebar_kolom = {
        "A": 6,   # No
        "B": 26,  # Nama Pelamar
        "C": 25,  # Status Dokumen
        "D": 28,  # Email
        "E": 18,  # No. Telepon / WA
        "F": 45,  # Pengalaman Kerja & Magang
        "G": 40,  # Riwayat Pendidikan & Akademik
        "H": 35,  # Keahlian & Keterampilan
        "I": 25,  # Kemampuan Bahasa
        "J": 35,  # Pengalaman Organisasi
        "K": 35,  # Prestasi & Sertifikasi
        "L": 40,  # Profil & Data Pribadi
        "M": 26,  # Keterangan Dokumen
        "N": 32   # Nama File PDF Asli
    }
    for col_huruf, lebar in lebar_kolom.items():
        ws.column_dimensions[col_huruf].width = lebar

    # Freeze Header & Filter
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions

    # Simpan ke output_csv & web-dashboard/public
    daftar_simpan_excel = [
        os.path.join(folder_output, "rekap_pelamar_cv.xlsx"),
        os.path.join(folder_output, "semua_data_tergabung.xlsx"),
        os.path.join("web-dashboard", "public", "rekap_pelamar_cv.xlsx")
    ]
    for pe in daftar_simpan_excel:
        try:
            os.makedirs(os.path.dirname(pe), exist_ok=True)
            wb.save(pe)
            print(f"[BERHASIL] File Excel Rapi tersimpan : {pe}")
        except PermissionError:
            print(f"[INFO] '{pe}' sedang dibuka di Excel. Melewati file ini...")
        except Exception as e:
            print(f"[ERROR] Gagal menyimpan '{pe}': {e}")

    # =========================================================================
    # 2. GENERATE CSV RAPI (.CSV DENGAN UTF-8 BOM)
    # =========================================================================
    daftar_simpan_csv = [
        os.path.join(folder_output, "rekap_pelamar_cv.csv"),
        os.path.join(folder_output, "semua_data_tergabung.csv"),
        os.path.join("web-dashboard", "public", "rekap_pelamar_cv.csv")
    ]
    for pc in daftar_simpan_csv:
        try:
            os.makedirs(os.path.dirname(pc), exist_ok=True)
            with open(pc, mode="w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f, quoting=csv.QUOTE_ALL)
                writer.writerow(headers)
                writer.writerows(rekap_baris)
            print(f"[BERHASIL] File CSV Rapi tersimpan   : {pc}")
        except PermissionError:
            print(f"[INFO] '{pc}' sedang dibuka di program lain. Melewati...")
        except Exception as e:
            print(f"[ERROR] Gagal menyimpan '{pc}': {e}")

    print("=" * 75)
    print(f"REKAP SELESAI DENGAN SUKSES!")
    print(f"  • Total Pelamar / File (Baris ke Bawah) : {total_file} baris")
    print(f"  • Berisi Tabel Terstruktur              : {stat_tabel} (🟢 Hijau)")
    print(f"  • Teks Bebas / CV Non-Tabel             : {stat_teks} (🟡 Kuning)")
    print(f"  • File Corrupt / Rusak                  : {stat_corrupt} (🔴 Merah)")
    print("=" * 75)


if __name__ == "__main__":
    buat_rekap_rapi()
