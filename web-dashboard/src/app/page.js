"use client";

import { useState, useEffect, useMemo } from "react";
import { parseCv, isDateLine, parseKeyValue } from "../utils/cvParser";

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailViewMode, setDetailViewMode] = useState("structured"); // "structured" | "raw"
  const [copiedText, setCopiedText] = useState("");

  // Ambil data kandidat secara asinkron dari public/data/pelamar.json
  useEffect(() => {
    fetch("/data/pelamar.json")
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat data kandidat:", err);
        setLoading(false);
      });
  }, []);

  // Filter kandidat berdasarkan search dan status
  const filteredData = useMemo(() => {
    return candidates.filter((item) => {
      const query = search.toLowerCase();
      const matchSearch =
        item.nama.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.telepon.toLowerCase().includes(query) ||
        item.rincian_cv.toLowerCase().includes(query) ||
        item.nama_file.toLowerCase().includes(query);

      if (!matchSearch) return false;

      if (filterStatus === "ALL") return true;
      if (filterStatus === "TABEL") return item.status.includes("SUKSES");
      if (filterStatus === "TEKS") return item.status.includes("TANPA TABEL");
      if (filterStatus === "CORRUPT")
        return item.status.includes("CORRUPT") || item.status.includes("ERROR");

      return true;
    });
  }, [candidates, search, filterStatus]);

  // Statistik
  const stats = useMemo(() => {
    const total = candidates.length;
    const tabel = candidates.filter((d) => d.status.includes("SUKSES")).length;
    const teks = candidates.filter((d) => d.status.includes("TANPA TABEL")).length;
    const corrupt = candidates.filter(
      (d) => d.status.includes("CORRUPT") || d.status.includes("ERROR")
    ).length;
    return { total, tabel, teks, corrupt };
  }, [candidates]);

  // Parsing CV untuk modal
  const parsedModalCv = useMemo(() => {
    if (!selectedCandidate) return null;
    return parseCv(selectedCandidate.rincian_cv);
  }, [selectedCandidate]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const getStatusBadge = (status) => {
    if (status.includes("SUKSES")) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
          Tabel Terstruktur
        </span>
      );
    }
    if (status.includes("TANPA TABEL")) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: "#fffbeb",
            color: "#92400e",
            border: "1px solid #fde68a",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f59e0b" }}></span>
          Teks Bebas / CV
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "9999px",
          fontSize: "11px",
          fontWeight: 600,
          backgroundColor: "#fef2f2",
          color: "#9f1239",
          border: "1px solid #fecdd3",
        }}
      >
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f43f5e" }}></span>
        Corrupt / Error
      </span>
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* Top Navbar Clean Light */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          padding: "16px 28px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between" style={{ flexWrap: "wrap", gap: "16px" }}>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "17px",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              }}
            >
              TS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  TalentScan
                </h1>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#eef2ff",
                    color: "#4338ca",
                    border: "1px solid #c7d2fe",
                  }}
                >
                  Batch 100 CV
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b" }}>
                Portal Rekapitulasi Pelamar Hasil Ekstraksi PDF Otomatis
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
            <a
              href="/api/download/rekap_pelamar_cv_bersubjudul.xlsx"
              download="rekap_pelamar_cv_bersubjudul.xlsx"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "9px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
                textDecoration: "none",
                transition: "all 0.15s",
                boxShadow: "0 1px 2px rgba(6, 95, 70, 0.05)",
              }}
            >
              <span>📥</span>
              <span>Download Excel (100 CV Bersubjudul)</span>
            </a>
            <a
              href="/api/download/rekap_pelamar_cv_bersubjudul.csv"
              download="rekap_pelamar_cv_bersubjudul.csv"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "9px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#eef2ff",
                color: "#3730a3",
                border: "1px solid #c7d2fe",
                textDecoration: "none",
                transition: "all 0.15s",
                boxShadow: "0 1px 2px rgba(55, 48, 163, 0.05)",
              }}
            >
              <span>📥</span>
              <span>Download CSV (100 CV Bersubjudul)</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        className="max-w-7xl mx-auto px-4 py-8"
        style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", gap: "22px" }}
      >
        {/* Metric Cards Clean Light */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px" }}>
          {/* Card 1: Total */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Total Pelamar Terdata</span>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: "30px", fontWeight: 800, color: "#0f172a" }}>{stats.total}</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                }}
              >
                100% PDF
              </span>
            </div>
          </div>

          {/* Card 2: Tabel */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #a7f3d0",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#059669" }}>Tabel Terstruktur</span>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: "30px", fontWeight: 800, color: "#047857" }}>{stats.tabel}</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                }}
              >
                🟢 Terverifikasi
              </span>
            </div>
          </div>

          {/* Card 3: Teks Bebas */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #fde68a",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#d97706" }}>Teks Bebas / Paragraf</span>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: "30px", fontWeight: 800, color: "#b45309" }}>{stats.teks}</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#fffbeb",
                  color: "#92400e",
                }}
              >
                🟡 CV Lengkap
              </span>
            </div>
          </div>

          {/* Card 4: Corrupt */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #fecdd3",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#e11d48" }}>Corrupt / Rusak</span>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: "30px", fontWeight: 800, color: "#be123c" }}>{stats.corrupt}</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#fef2f2",
                  color: "#9f1239",
                }}
              >
                🔴 Rusak/Kunci
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar Clean */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          {/* Search Input */}
          <div style={{ position: "relative", flex: "1 1 320px", maxWidth: "440px" }}>
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, no. HP, atau keahlian..."
              style={{
                width: "100%",
                padding: "9px 36px 9px 36px",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                fontWeight: 500,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2" style={{ overflowX: "auto", flexWrap: "wrap" }}>
            <button
              onClick={() => setFilterStatus("ALL")}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: filterStatus === "ALL" ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                cursor: "pointer",
                backgroundColor: filterStatus === "ALL" ? "#4f46e5" : "#ffffff",
                color: filterStatus === "ALL" ? "#ffffff" : "#475569",
                boxShadow: filterStatus === "ALL" ? "0 2px 6px rgba(79, 70, 229, 0.25)" : "none",
              }}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus("TABEL")}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: filterStatus === "TABEL" ? "1px solid #059669" : "1px solid #e2e8f0",
                cursor: "pointer",
                backgroundColor: filterStatus === "TABEL" ? "#059669" : "#ffffff",
                color: filterStatus === "TABEL" ? "#ffffff" : "#475569",
                boxShadow: filterStatus === "TABEL" ? "0 2px 6px rgba(5, 150, 105, 0.25)" : "none",
              }}
            >
              🟢 Ada Tabel ({stats.tabel})
            </button>
            <button
              onClick={() => setFilterStatus("TEKS")}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: filterStatus === "TEKS" ? "1px solid #d97706" : "1px solid #e2e8f0",
                cursor: "pointer",
                backgroundColor: filterStatus === "TEKS" ? "#d97706" : "#ffffff",
                color: filterStatus === "TEKS" ? "#ffffff" : "#475569",
                boxShadow: filterStatus === "TEKS" ? "0 2px 6px rgba(217, 119, 6, 0.25)" : "none",
              }}
            >
              🟡 Teks Bebas ({stats.teks})
            </button>
            <button
              onClick={() => setFilterStatus("CORRUPT")}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: filterStatus === "CORRUPT" ? "1px solid #e11d48" : "1px solid #e2e8f0",
                cursor: "pointer",
                backgroundColor: filterStatus === "CORRUPT" ? "#e11d48" : "#ffffff",
                color: filterStatus === "CORRUPT" ? "#ffffff" : "#475569",
                boxShadow: filterStatus === "CORRUPT" ? "0 2px 6px rgba(225, 29, 72, 0.25)" : "none",
              }}
            >
              🔴 Corrupt ({stats.corrupt})
            </button>
          </div>
        </div>

        {/* Banner Fitur Download Rekap Master Bersubjudul */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #c7d2fe",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
            boxShadow: "0 1px 3px rgba(79, 70, 229, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: "1 1 340px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "#eef2ff",
                color: "#4338ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                flexShrink: 0,
                border: "1px solid #c7d2fe",
              }}
            >
              📑
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                  Download Master Rekapitulasi (1 File Langsung Seluruh 100 Data CV)
                </h3>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  ✨ Kolom Subjudul Lengkap
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                File Excel & CSV sudah dilengkapi kolom subjudul: <b>Pengalaman Kerja, Riwayat Pendidikan, Keahlian, Bahasa, Organisasi, Prestasi</b>, dan <b>Data Pribadi</b> berpoin rapi.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="/api/download/rekap_pelamar_cv_bersubjudul.xlsx"
              download="rekap_pelamar_cv_bersubjudul.xlsx"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: "#059669",
                color: "#ffffff",
                border: "none",
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
                transition: "all 0.15s",
              }}
            >
              <span>📥</span>
              <span>Download Excel Master (.xlsx)</span>
            </a>
            <a
              href="/api/download/rekap_pelamar_cv_bersubjudul.csv"
              download="rekap_pelamar_cv_bersubjudul.csv"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                border: "none",
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
                transition: "all 0.15s",
              }}
            >
              <span>📥</span>
              <span>Download CSV Master (.csv)</span>
            </a>
          </div>
        </div>

        {/* Candidate Table Clean Light */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div className="overflow-x-auto">
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#475569",
                  }}
                >
                  <th style={{ padding: "14px 16px", textAlign: "center", width: "50px" }}>No</th>
                  <th style={{ padding: "14px 16px" }}>Nama Pelamar</th>
                  <th style={{ padding: "14px 16px" }}>Status Dokumen</th>
                  <th style={{ padding: "14px 16px" }}>Kontak (Email & HP)</th>
                  <th style={{ padding: "14px 16px" }}>Keterangan</th>
                  <th style={{ padding: "14px 16px", textAlign: "right", width: "120px" }}>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      Memuat 100 data pelamar...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
                      <p style={{ fontWeight: 500 }}>Tidak ada kandidat yang cocok dengan pencarian "{search}".</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.no}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* No */}
                      <td style={{ padding: "12px 16px", textAlign: "center", color: "#94a3b8", fontFamily: "monospace", fontSize: "12px" }}>
                        {item.no}
                      </td>

                      {/* Nama Pelamar */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: "#eef2ff",
                              border: "1px solid #c7d2fe",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "11px",
                              color: "#4338ca",
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(item.nama)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.nama}</div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                maxWidth: "240px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={item.nama_file}
                            >
                              📄 {item.nama_file}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Kontak */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "12px" }}>
                          {item.email ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1e293b" }}>
                              <span style={{ color: "#94a3b8" }}>✉️</span>
                              <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.email}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "11px" }}>Email tidak ada</span>
                          )}

                          {item.telepon ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1e293b" }}>
                              <span style={{ color: "#94a3b8" }}>📞</span>
                              <span>{item.telepon.split("\n")[0]}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>
                        {item.keterangan || "-"}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => {
                            setSelectedCandidate(item);
                            setDetailViewMode("structured");
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "7px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: "#eef2ff",
                            color: "#4338ca",
                            border: "1px solid #c7d2fe",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div
            style={{
              padding: "14px 20px",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            <span>
              Menampilkan <strong style={{ color: "#0f172a" }}>{filteredData.length}</strong> dari {candidates.length} kandidat
            </span>
            <span>Klik "Lihat Detail" untuk membaca seluruh riwayat CV terstruktur</span>
          </div>
        </div>
      </main>

      {/* Modal Detail CV Pelamar Clean Light */}
      {selectedCandidate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              width: "100%",
              maxWidth: "820px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #cbd5e1",
              boxShadow: "0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header Clean Light */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "16px",
                    color: "#ffffff",
                    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)",
                  }}
                >
                  {getInitials(selectedCandidate.nama)}
                </div>
                <div>
                  <h3 style={{ fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>{selectedCandidate.nama}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    {getStatusBadge(selectedCandidate.status)}
                    <span style={{ fontSize: "11px", color: "#64748b" }}>📄 {selectedCandidate.nama_file}</span>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle & Close Button */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    backgroundColor: "#e2e8f0",
                    borderRadius: "8px",
                    padding: "2px",
                  }}
                >
                  <button
                    onClick={() => setDetailViewMode("structured")}
                    style={{
                      padding: "4px 11px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: detailViewMode === "structured" ? "#ffffff" : "transparent",
                      color: detailViewMode === "structured" ? "#0f172a" : "#475569",
                      boxShadow: detailViewMode === "structured" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    ✨ Subjudul
                  </button>
                  <button
                    onClick={() => setDetailViewMode("raw")}
                    style={{
                      padding: "4px 11px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: detailViewMode === "raw" ? "#ffffff" : "transparent",
                      color: detailViewMode === "raw" ? "#0f172a" : "#475569",
                      boxShadow: detailViewMode === "raw" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    📄 Teks Asli
                  </button>
                </div>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "#e2e8f0",
                    border: "none",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "24px",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                backgroundColor: "#ffffff",
              }}
            >
              {/* Kontak Banner Clean */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
                      Alamat Email
                    </span>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                      {selectedCandidate.email || "Tidak terdeteksi"}
                    </p>
                  </div>
                  {selectedCandidate.email && (
                    <button
                      onClick={() => handleCopy(selectedCandidate.email, "email")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        borderRadius: "6px",
                        backgroundColor: "#eef2ff",
                        color: "#4338ca",
                        border: "1px solid #c7d2fe",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {copiedText === "email" ? "Tersalin!" : "Salin"}
                    </button>
                  )}
                </div>

                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
                      No. Telepon / WhatsApp
                    </span>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                      {selectedCandidate.telepon || "Tidak terdeteksi"}
                    </p>
                  </div>
                  {selectedCandidate.telepon && (
                    <button
                      onClick={() => handleCopy(selectedCandidate.telepon, "phone")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        borderRadius: "6px",
                        backgroundColor: "#eef2ff",
                        color: "#4338ca",
                        border: "1px solid #c7d2fe",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {copiedText === "phone" ? "Tersalin!" : "Salin"}
                    </button>
                  )}
                </div>
              </div>

              {/* TAMPILAN 1: TERSTRUKTUR BERSUBJUDUL (CLEAN LIGHT CARDS) */}
              {detailViewMode === "structured" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Kasus Error / Corrupt */}
                  {parsedModalCv?.status === "error" && (
                    <div
                      style={{
                        padding: "18px",
                        borderRadius: "10px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecdd3",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "#9f1239" }}>
                        <span>⚠️</span>
                        <span>File Corrupt / Gagal Dibaca</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#be123c" }}>{parsedModalCv.message}</p>
                      <p style={{ fontSize: "11px", color: "#64748b" }}>
                        💡 Catatan: File PDF ini mungkin diproteksi password atau rusak saat diunduh.
                      </p>
                    </div>
                  )}

                  {/* Kasus Scan Gambar */}
                  {parsedModalCv?.status === "scan_only" && (
                    <div
                      style={{
                        padding: "18px",
                        borderRadius: "10px",
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fde68a",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "#92400e" }}>
                        <span>📷</span>
                        <span>Dokumen Scan Gambar (Tanpa Teks Digital)</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#b45309" }}>{parsedModalCv.message}</p>
                    </div>
                  )}

                  {/* Seksi-Seksi Subjudul Clean Light Cards */}
                  {parsedModalCv?.sections && parsedModalCv.sections.length > 0
                    ? parsedModalCv.sections.map((section) => (
                        <div
                          key={section.id}
                          style={{
                            borderRadius: "12px",
                            backgroundColor: "#ffffff",
                            border: `1px solid ${section.badgeBorder || "#e2e8f0"}`,
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          }}
                        >
                          {/* Section Header Clean Pastel Bar */}
                          <div
                            style={{
                              padding: "10px 16px",
                              backgroundColor: section.badgeBg || "#f8fafc",
                              borderBottom: `1px solid ${section.badgeBorder || "#e2e8f0"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "15px" }}>{section.icon}</span>
                              <h4
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                  color: section.badgeColor || "#0f172a",
                                }}
                              >
                                {section.title}
                              </h4>
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                backgroundColor: "#ffffff",
                                color: section.badgeColor || "#475569",
                                border: `1px solid ${section.badgeBorder || "#cbd5e1"}`,
                              }}
                            >
                              {section.items.length} rincian
                            </span>
                          </div>

                          {/* Section Content Items Clean */}
                          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "7px" }}>
                            {section.items.map((item, idx) => {
                              const kv = parseKeyValue(item);
                              const hasDate = isDateLine(item);

                              // Key-Value (misal: Tanggal lahir : ...)
                              if (kv) {
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex",
                                      alignItems: "baseline",
                                      gap: "8px",
                                      fontSize: "12px",
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      backgroundColor: "#f8fafc",
                                      border: "1px solid #f1f5f9",
                                    }}
                                  >
                                    <span style={{ color: "#64748b", fontWeight: 600, minWidth: "130px" }}>{kv.key}:</span>
                                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{kv.value}</span>
                                  </div>
                                );
                              }

                              // Date / Timeline
                              if (hasDate) {
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "#0369a1",
                                      backgroundColor: "#e0f2fe",
                                      padding: "3px 9px",
                                      borderRadius: "6px",
                                      width: "fit-content",
                                      marginTop: "3px",
                                      marginBottom: "1px",
                                      border: "1px solid #bae6fd",
                                    }}
                                  >
                                    <span>📅</span>
                                    <span>{item}</span>
                                  </div>
                                );
                              }

                              // Regular / Bullet Item
                              const isBullet = item.startsWith("•") || item.startsWith("-") || item.startsWith("*");
                              const contentText = isBullet ? item.replace(/^[•\-*]\s*/, "") : item;

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                    fontSize: "12px",
                                    lineHeight: "1.55",
                                    color: "#334155",
                                  }}
                                >
                                  <span style={{ color: section.badgeColor || "#64748b", marginTop: "3px", fontSize: "8px" }}>
                                    ●
                                  </span>
                                  <span style={{ flex: 1, wordBreak: "break-word" }}>{contentText}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              )}

              {/* TAMPILAN 2: TEKS MENTAH ASLI CLEAN */}
              {detailViewMode === "raw" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#64748b" }}>
                      Dokumen Mentah Asli Hasil Ekstraksi
                    </h4>
                    <button
                      onClick={() => handleCopy(selectedCandidate.rincian_cv, "cv")}
                      style={{ fontSize: "11px", color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      {copiedText === "cv" ? "✓ Seluruh Teks Tersalin" : "Salin Semua Teks"}
                    </button>
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      color: "#1e293b",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                      maxHeight: "380px",
                      overflowY: "auto",
                    }}
                  >
                    {selectedCandidate.rincian_cv || "Tidak ada rincian yang dapat diekstrak dari dokumen ini."}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Clean */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                backgroundColor: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                  Download Master Seluruh 100 Data CV:
                </span>
                <a
                  href="/api/download/rekap_pelamar_cv_bersubjudul.xlsx"
                  download="rekap_pelamar_cv_bersubjudul.xlsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                    textDecoration: "none",
                  }}
                >
                  📥 Excel Bersubjudul (.xlsx)
                </a>
                <a
                  href="/api/download/rekap_pelamar_cv_bersubjudul.csv"
                  download="rekap_pelamar_cv_bersubjudul.csv"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: "#eef2ff",
                    color: "#3730a3",
                    border: "1px solid #c7d2fe",
                    textDecoration: "none",
                  }}
                >
                  📥 CSV Bersubjudul (.csv)
                </a>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Clean */}
      <footer
        style={{
          marginTop: "auto",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          padding: "20px",
          textAlign: "center",
          fontSize: "12px",
          color: "#64748b",
        }}
      >
        <p>TalentScan Dashboard • Batch PDF to Web Converter • Siap Deploy di Vercel</p>
      </footer>
    </div>
  );
}
