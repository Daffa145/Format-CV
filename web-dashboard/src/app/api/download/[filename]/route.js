import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const filename = params.filename || "";

  let targetFile = "";
  let contentType = "";
  let downloadName = "";

  if (filename.toLowerCase().endsWith(".csv") || filename.toLowerCase().includes("csv")) {
    targetFile = path.join(process.cwd(), "public", "rekap_pelamar_cv.csv");
    contentType = "text/csv; charset=utf-8";
    downloadName = "rekap_pelamar_cv_bersubjudul.csv";
  } else {
    targetFile = path.join(process.cwd(), "public", "rekap_pelamar_cv.xlsx");
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    downloadName = "rekap_pelamar_cv_bersubjudul.xlsx";
  }

  if (!fs.existsSync(targetFile)) {
    // Coba di folder output_csv jika di public belum ada
    const fallback = path.join(process.cwd(), "..", "output_csv", path.basename(targetFile));
    if (fs.existsSync(fallback)) {
      targetFile = fallback;
    } else {
      return new NextResponse("File tidak ditemukan di server", { status: 404 });
    }
  }

  const fileBuffer = fs.readFileSync(targetFile);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Content-Length": fileBuffer.length.toString(),
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
