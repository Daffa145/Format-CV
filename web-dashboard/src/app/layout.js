import "./globals.css";

export const metadata = {
  title: "TalentScan | Portal Rekapitulasi CV & Pelamar",
  description: "Platform visualisasi dan database interaktif 100 kandidat pelamar kerja yang diekstrak otomatis dari file PDF ke web.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
