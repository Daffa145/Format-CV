/**
 * cvParser.js
 * Modul untuk menganalisis dan memecah teks riwayat CV mentah menjadi
 * subjudul-subjudul terstruktur (Pendidikan, Pengalaman, Keahlian, dll)
 * dengan palette warna bersih (clean pastel) untuk kemudahan membaca sekilas.
 */

export function parseCv(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return {
      status: "empty",
      sections: [],
    };
  }

  const trimmed = rawText.trim();

  // Jika dokumen corrupt atau tidak terbaca
  if (trimmed.startsWith("ERROR:") || trimmed.includes("File rusak") || trimmed.includes("gagal dibaca")) {
    return {
      status: "error",
      message: trimmed,
      sections: [],
    };
  }

  if (trimmed.includes("[File tidak memiliki teks terbaca") || trimmed.includes("scan gambar tanpa OCR")) {
    return {
      status: "scan_only",
      message: "Dokumen ini merupakan file hasil scan gambar atau tidak memiliki teks digital yang dapat diekstrak otomatis.",
      sections: [],
    };
  }

  // Pemetaan kata kunci heading ke kategori terstruktur dengan skema warna CLEAN LIGHT
  const categoryMeta = {
    PROFILE: {
      title: "Profil & Informasi Pribadi",
      icon: "👤",
      badgeColor: "#4338ca", // Indigo-700
      badgeBg: "#eef2ff",    // Indigo-50
      badgeBorder: "#c7d2fe", // Indigo-200
    },
    EXPERIENCE: {
      title: "Pengalaman Kerja & Magang",
      icon: "💼",
      badgeColor: "#047857", // Emerald-700
      badgeBg: "#ecfdf5",    // Emerald-50
      badgeBorder: "#a7f3d0", // Emerald-200
    },
    EDUCATION: {
      title: "Riwayat Pendidikan & Akademik",
      icon: "🎓",
      badgeColor: "#b45309", // Amber-700
      badgeBg: "#fffbeb",    // Amber-50
      badgeBorder: "#fde68a", // Amber-200
    },
    ORGANIZATION: {
      title: "Pengalaman Organisasi & Kepanitiaan",
      icon: "👥",
      badgeColor: "#6d28d9", // Purple-700
      badgeBg: "#f5f3ff",    // Purple-50
      badgeBorder: "#ddd6fe", // Purple-200
    },
    SKILLS: {
      title: "Keahlian, Keterampilan & Tools",
      icon: "⚡",
      badgeColor: "#be185d", // Pink-700
      badgeBg: "#fdf2f8",    // Pink-50
      badgeBorder: "#fbcfe8", // Pink-200
    },
    LANGUAGES: {
      title: "Kemampuan Bahasa",
      icon: "🌐",
      badgeColor: "#0e7490", // Cyan-700
      badgeBg: "#ecfeff",    // Cyan-50
      badgeBorder: "#a5f3fc", // Cyan-200
    },
    ACHIEVEMENTS: {
      title: "Prestasi, Sertifikasi & Pelatihan",
      icon: "🏆",
      badgeColor: "#a16207", // Yellow-700
      badgeBg: "#fefce8",    // Yellow-50
      badgeBorder: "#fef08a", // Yellow-200
    },
    OTHER: {
      title: "Rincian & Informasi Tambahan",
      icon: "📄",
      badgeColor: "#334155", // Slate-700
      badgeBg: "#f8fafc",    // Slate-50
      badgeBorder: "#e2e8f0", // Slate-200
    },
  };

  // Bersihkan karakter aneh seperti replacement character
  const sanitizedText = trimmed.replace(/\uFFFD/g, "• ").replace(/[]/g, "• ");

  const lines = sanitizedText.split("\n");
  const parsedSections = {};
  let currentKey = "PROFILE";

  const addLineToSection = (key, line) => {
    if (!parsedSections[key]) {
      parsedSections[key] = [];
    }
    const cleanLine = line.trim();
    if (cleanLine) {
      parsedSections[key].push(cleanLine);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const upper = line.toUpperCase();

    // 1. Deteksi Pengalaman Kerja
    if (
      upper.includes("PENGALAMAN KERJA") ||
      upper.includes("WORK EXPERIENCE") ||
      upper.includes("RIWAYAT PEKERJAAN") ||
      upper.includes("PENGALAMAN MAGANG") ||
      (upper.startsWith("PENGALAMAN") && line.length < 35) ||
      upper === "EXPERIENCE" ||
      upper === "RIWAYAT KARIR"
    ) {
      currentKey = "EXPERIENCE";
      continue;
    }

    // 2. Deteksi Pendidikan
    if (
      upper.includes("PENDIDIKAN") ||
      upper.includes("EDUCATION") ||
      upper.includes("RIWAYAT PENDIDIKAN") ||
      upper.includes("LATAR BELAKANG PENDIDIKAN") ||
      upper.includes("PENDIDIKAN FORMAL") ||
      upper.includes("EDUKASI")
    ) {
      currentKey = "EDUCATION";
      const matchInline = line.match(/(?:PENDIDIKAN|EDUCATION)\s+(.*)/i);
      if (matchInline && matchInline[1].trim()) {
        const trailing = matchInline[1].trim();
        if (trailing.includes(":") || trailing.toLowerCase().includes("lahir")) {
          addLineToSection("PROFILE", trailing);
        } else {
          addLineToSection("EDUCATION", trailing);
        }
      }
      continue;
    }

    // 3. Deteksi Organisasi
    if (
      upper.includes("PENGALAMAN ORGANISASI") ||
      upper.includes("ORGANIZATIONAL EXPERIENCE") ||
      (upper.startsWith("ORGANISASI") && line.length < 30) ||
      upper.includes("KEPANITIAAN")
    ) {
      currentKey = "ORGANIZATION";
      continue;
    }

    // 4. Deteksi Keahlian / Keterampilan / Skills
    if (
      upper.includes("KETERAMPILAN") ||
      upper.includes("KEAHLIAN") ||
      upper.includes("SKILLS") ||
      upper.includes("SKILL") ||
      upper.includes("KOMPETENSI") ||
      upper.includes("HARD SKILL") ||
      upper.includes("SOFT SKILL") ||
      upper.includes("KEMAMPUAN")
    ) {
      currentKey = "SKILLS";
      continue;
    }

    // 5. Deteksi Bahasa
    if (
      upper.includes("BAHASA") ||
      upper.includes("LANGUAGES") ||
      upper.includes("KEMAMPUAN BAHASA")
    ) {
      currentKey = "LANGUAGES";
      continue;
    }

    // 6. Deteksi Sertifikasi / Prestasi
    if (
      upper.includes("SERTIFIKASI") ||
      upper.includes("SERTIFIKAT") ||
      upper.includes("PRESTASI") ||
      upper.includes("ACHIEVEMENTS") ||
      upper.includes("AWARDS") ||
      upper.includes("PELATIHAN") ||
      upper.includes("TRAINING") ||
      upper.includes("SEMINAR")
    ) {
      currentKey = "ACHIEVEMENTS";
      continue;
    }

    // 7. Deteksi Profil / Tentang Saya / Data Pribadi
    if (
      upper.includes("TENTANG SAYA") ||
      upper.includes("ABOUT ME") ||
      upper.includes("INFORMASI PRIBADI") ||
      upper.includes("DATA DIRI") ||
      upper.includes("PERSONAL INFO") ||
      upper.includes("OBJEKTIF") ||
      (upper.startsWith("PROFIL") && line.length < 25)
    ) {
      currentKey = "PROFILE";
      continue;
    }

    // Penanganan baris khusus yang memiliki kata kunci bahasa inline
    if (
      (line.includes("(Aktif)") || line.includes("(Pasif)") || line.includes("Native speaker") || line.includes("Intermediate")) &&
      (upper.includes("INDONESIA") || upper.includes("INGGRIS") || upper.includes("ENGLISH"))
    ) {
      addLineToSection("LANGUAGES", line);
      continue;
    }

    // Penanganan data pribadi
    if (
      (line.toLowerCase().includes("tanggal lahir") ||
       line.toLowerCase().includes("status pernikahan") ||
       line.toLowerCase().includes("kebangsaan") ||
       line.toLowerCase().includes("alamat") ||
       line.toLowerCase().includes("agama") ||
       line.toLowerCase().includes("jenis kelamin")) &&
      line.includes(":")
    ) {
      addLineToSection("PROFILE", line);
      continue;
    }

    addLineToSection(currentKey, line);
  }

  const resultSections = [];
  const orderedKeys = ["PROFILE", "EXPERIENCE", "EDUCATION", "SKILLS", "ORGANIZATION", "LANGUAGES", "ACHIEVEMENTS", "OTHER"];

  for (const key of orderedKeys) {
    if (parsedSections[key] && parsedSections[key].length > 0) {
      resultSections.push({
        id: key,
        ...categoryMeta[key],
        items: parsedSections[key],
      });
    }
  }

  if (resultSections.length === 1 && resultSections[0].id === "PROFILE" && resultSections[0].items.length > 5) {
    resultSections[0].title = "Ringkasan Riwayat & Ikhtisar CV";
    resultSections[0].icon = "📋";
    resultSections[0].badgeColor = "#0284c7";
    resultSections[0].badgeBg = "#f0f9ff";
    resultSections[0].badgeBorder = "#bae6fd";
  }

  return {
    status: "success",
    sections: resultSections,
  };
}

export function isDateLine(line) {
  const pattern = /(\b\d{4}\s*[-–]\s*\d{4}\b|\b\d{4}\b|\b(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|January|February|March|April|May|June|July|August|September|October|November|December)\b)/i;
  return pattern.test(line) && line.length < 50;
}

export function parseKeyValue(line) {
  if (line.includes(":") && line.split(":").length === 2) {
    const parts = line.split(":");
    const k = parts[0].trim();
    const v = parts[1].trim();
    if (k.length > 2 && k.length < 35 && v) {
      return { key: k, value: v };
    }
  }
  return null;
}
