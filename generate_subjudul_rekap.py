# ==============================================================================
# GENERATOR REKAP PELAMAR CV DENGAN SUBJUDUL TERSTRUKTUR (EXCEL & CSV)
# Menghasilkan file Excel (.xlsx) dan CSV (.csv) berisi seluruh 100 data pelamar
# dengan kolom-kolom subjudul sesuai tampilan modal:
# - Profil & Data Pribadi
# - Pengalaman Kerja & Magang
# - Riwayat Pendidikan & Akademik
# - Keahlian, Keterampilan & Tools
# - Kemampuan Bahasa
# - Pengalaman Organisasi
# - Prestasi & Sertifikasi
# ==============================================================================

import os
import sys
import re
import json
import csv
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Pastikan UTF-8 di Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_cv_ke_subjudul(teks_cv):
    """
    Memecah teks mentah CV menjadi dictionary kategori subjudul terstruktur:
    PROFILE, EXPERIENCE, EDUCATION, SKILLS, LANGUAGES, ORGANIZATION, ACHIEVEMENTS, OTHER
    """
    if not teks_cv or not isinstance(teks_cv, str):
        return {}

    trimmed = teks_cv.strip()
    if trimmed.startswith("ERROR:") or "File rusak" in trimmed or "gagal dibaca" in trimmed:
        return {"ERROR": [trimmed]}
    if "[File tidak memiliki teks terbaca" in trimmed or "scan gambar tanpa OCR" in trimmed:
        return {"SCAN": ["[Dokumen hasil scan gambar / tanpa teks digital OCR]"]}

    sanitized = trimmed.replace("\uFFFD", "• ").replace("[]", "• ")
    lines = sanitized.split("\n")
    sections = {}
    current_key = "PROFILE"

    def add_line(key, l):
        if key not in sections:
            sections[key] = []
        cl = l.strip()
        if cl:
            sections[key].append(cl)

    for line in lines:
        l = line.strip()
        if not l:
            continue
        up = l.upper()

        # 1. Deteksi Pengalaman Kerja
        if (
            any(k in up for k in ["PENGALAMAN KERJA", "WORK EXPERIENCE", "RIWAYAT PEKERJAAN", "PENGALAMAN MAGANG"])
            or (up.startswith("PENGALAMAN") and len(l) < 35)
            or up in ["EXPERIENCE", "RIWAYAT KARIR"]
        ):
            current_key = "EXPERIENCE"
            continue

        # 2. Deteksi Pendidikan
        if any(k in up for k in ["PENDIDIKAN", "EDUCATION", "RIWAYAT PENDIDIKAN", "LATAR BELAKANG PENDIDIKAN", "PENDIDIKAN FORMAL", "EDUKASI"]):
            current_key = "EDUCATION"
            m = re.search(r'(?:PENDIDIKAN|EDUCATION)\s+(.*)', l, re.IGNORECASE)
            if m and m.group(1).strip():
                tr = m.group(1).strip()
                if ":" in tr or "lahir" in tr.lower():
                    add_line("PROFILE", tr)
                else:
                    add_line("EDUCATION", tr)
            continue

        # 3. Deteksi Pengalaman Organisasi
        if (
            any(k in up for k in ["PENGALAMAN ORGANISASI", "ORGANIZATIONAL EXPERIENCE", "KEPANITIAAN"])
            or (up.startswith("ORGANISASI") and len(l) < 30)
        ):
            current_key = "ORGANIZATION"
            continue

        # 4. Deteksi Keahlian & Keterampilan
        if any(k in up for k in ["KETERAMPILAN", "KEAHLIAN", "SKILLS", "SKILL", "KOMPETENSI", "HARD SKILL", "SOFT SKILL", "KEMAMPUAN"]):
            current_key = "SKILLS"
            continue

        # 5. Deteksi Kemampuan Bahasa
        if any(k in up for k in ["BAHASA", "LANGUAGES", "KEMAMPUAN BAHASA"]):
            current_key = "LANGUAGES"
            continue

        # 6. Deteksi Prestasi & Sertifikasi
        if any(k in up for k in ["SERTIFIKASI", "SERTIFIKAT", "PRESTASI", "ACHIEVEMENTS", "AWARDS", "PELATIHAN", "TRAINING", "SEMINAR"]):
            current_key = "ACHIEVEMENTS"
            continue

        # 7. Deteksi Profil / Tentang Saya / Data Pribadi
        if (
            any(k in up for k in ["TENTANG SAYA", "ABOUT ME", "INFORMASI PRIBADI", "DATA DIRI", "PERSONAL INFO", "OBJEKTIF"])
            or (up.startswith("PROFIL") and len(l) < 25)
        ):
            current_key = "PROFILE"
            continue

        # Penanganan khusus inline bahasa
        if any(s in l for s in ["(Aktif)", "(Pasif)", "Native speaker", "Intermediate"]) and any(lang in up for lang in ["INDONESIA", "INGGRIS", "ENGLISH"]):
            add_line("LANGUAGES", l)
            continue

        # Penanganan khusus baris data pribadi (tanggal lahir, alamat, status)
        if any(p in l.lower() for p in ["tanggal lahir", "status pernikahan", "kebangsaan", "alamat", "agama", "jenis kelamin"]) and ":" in l:
            add_line("PROFILE", l)
            continue

        add_line(current_key, l)

    return sections


def format_bullet_points(items_list):
    """Mengubah list baris menjadi teks berpoin rapi (• item)"""
    if not items_list:
        return "-"
    
    formatted = []
    for it in items_list:
        clean = it.strip()
        if not clean:
            continue
        # Jika sudah berpoin atau ber-dash
        if clean.startswith("•") or clean.startswith("-") or clean.startswith("*"):
            formatted.append(clean)
        else:
            formatted.append(f"• {clean}")
            
    return "\n".join(formatted) if formatted else "-"


def buat_file_rekap_subjudul():
    """
    Membaca data seluruh pelamar dari web-dashboard/public/data/pelamar.json
    dan menghasilkan file Excel (.xlsx) dan CSV (.csv) lengkap dengan subjudul.
    """
    json_path = os.path.join("web-dashboard", "public", "data", "pelamar.json")
    if not os.path.exists(json_path):
        print(f"[ERROR] File '{json_path}' tidak ditemukan!")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data_pelamar = json.load(f)

    total_kandidat = len(data_pelamar)
    print(f"[INFO] Memproses {total_kandidat} pelamar dengan subjudul terstruktur...")

    # Header kolom Excel & CSV
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

    baris_data = []

    for item in data_pelamar:
        no = item.get("no", "")
        nama = item.get("nama", "")
        status = item.get("status", "")
        email = item.get("email", "-") or "-"
        telepon = item.get("telepon", "-") or "-"
        keterangan = item.get("keterangan", "")
        nama_file = item.get("nama_file", "")
        rincian_cv = item.get("rincian_cv", "")

        # Ekstrak subjudul
        sections = parse_cv_ke_subjudul(rincian_cv)

        if "ERROR" in sections:
            exp_text = "-"
            edu_text = "-"
            skills_text = "-"
            lang_text = "-"
            org_text = "-"
            ach_text = "-"
            prof_text = f"File corrupt / gagal dibaca: {sections['ERROR'][0]}"
        elif "SCAN" in sections:
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

        baris_data.append([
            no,
            nama,
            status,
            email,
            telepon,
            exp_text,
            edu_text,
            skills_text,
            lang_text,
            org_text,
            ach_text,
            prof_text,
            keterangan,
            nama_file
        ])

    # =========================================================================
    # 1. BUAT WORKBOOK EXCEL (.XLSX)
    # =========================================================================
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Rekap CV Bersubjudul"

    # Header styling (Clean Navy Header)
    ws.append(headers)
    ws.row_dimensions[1].height = 32

    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Slate-800
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    
    border_tipis = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Styling Status Badges
    fill_hijau = PatternFill(start_color="ECFDF5", end_color="ECFDF5", fill_type="solid")
    font_hijau = Font(name="Segoe UI", size=10, color="065F46", bold=True)

    fill_kuning = PatternFill(start_color="FFFBEB", end_color="FFFBEB", fill_type="solid")
    font_kuning = Font(name="Segoe UI", size=10, color="92400E", bold=True)

    fill_merah = PatternFill(start_color="FEF2F2", end_color="FEF2F2", fill_type="solid")
    font_merah = Font(name="Segoe UI", size=10, color="991B1B", bold=True)

    font_regular = Font(name="Segoe UI", size=10, color="1E293B")
    font_nama = Font(name="Segoe UI", size=10, bold=True, color="0F172A")

    for row_idx, row in enumerate(baris_data, start=2):
        ws.append(row)
        ws.row_dimensions[row_idx].height = 55  # Tinggi baris nyaman untuk melihat poin-poin

        status_text = str(row[2])

        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.border = border_tipis
            cell.font = font_regular
            cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

            # Khusus No
            if col_idx == 1:
                cell.alignment = Alignment(horizontal="center", vertical="top")
            # Khusus Nama
            elif col_idx == 2:
                cell.font = font_nama
            # Khusus Status
            elif col_idx == 3:
                cell.alignment = Alignment(horizontal="center", vertical="top")
                if "SUKSES" in status_text:
                    cell.fill = fill_hijau
                    cell.font = font_hijau
                elif "TANPA TABEL" in status_text:
                    cell.fill = fill_kuning
                    cell.font = font_kuning
                elif "CORRUPT" in status_text or "ERROR" in status_text:
                    cell.fill = fill_merah
                    cell.font = font_merah

        # Highlight merah jika corrupt
        if "CORRUPT" in status_text or "ERROR" in status_text:
            for col_idx in range(1, len(headers) + 1):
                ws.cell(row=row_idx, column=col_idx).fill = fill_merah

    # Atur lebar kolom yang proporsional & nyaman dibaca
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

    for col_letter, width in lebar_kolom.items():
        ws.column_dimensions[col_letter].width = width

    # Freeze Header agar judul kolom tetap terlihat saat di-scroll
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions

    # Target lokasi penyimpanan Excel
    target_excels = [
        os.path.join("web-dashboard", "public", "rekap_pelamar_cv.xlsx"),
        os.path.join("output_csv", "rekap_pelamar_cv.xlsx"),
        os.path.join("output_csv", "semua_data_tergabung.xlsx")
    ]

    for p in target_excels:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            wb.save(p)
            print(f"[SUKSES] Excel tersimpan di: {p}")
        except PermissionError:
            print(f"[PERINGATAN] File '{p}' sedang dibuka di program lain. Melewati...")
        except Exception as e:
            print(f"[ERROR] Gagal menyimpan '{p}': {e}")

    # =========================================================================
    # 2. BUAT FILE CSV (.CSV DENGAN UTF-8 BOM)
    # =========================================================================
    target_csvs = [
        os.path.join("web-dashboard", "public", "rekap_pelamar_cv.csv"),
        os.path.join("output_csv", "rekap_pelamar_cv.csv"),
        os.path.join("output_csv", "semua_data_tergabung.csv")
    ]

    for p in target_csvs:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, mode="w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f, quoting=csv.QUOTE_ALL)
                writer.writerow(headers)
                writer.writerows(baris_data)
            print(f"[SUKSES] CSV tersimpan di  : {p}")
        except PermissionError:
            print(f"[PERINGATAN] File '{p}' sedang dibuka di program lain. Melewati...")
        except Exception as e:
            print(f"[ERROR] Gagal menyimpan '{p}': {e}")

    print("\n" + "=" * 70)
    print(f"SELESAI! Seluruh {total_kandidat} data pelamar berhasil diekspor bersubjudul!")
    print("=" * 70)


if __name__ == "__main__":
    buat_file_rekap_subjudul()
