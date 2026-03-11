import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cetak Laporan PBB",
};

// Layout bersih khusus untuk halaman cetak — html & body ada di sini, bukan di page
export default function CetakLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, background: "#f0f0f0", fontFamily: "'Times New Roman', Times, serif" }}>
        {children}
      </body>
    </html>
  );
}
