"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

export function LaporanActionButtons({ tahun, currentUser }: { tahun: number; currentUser?: any }) {
  const handleExport = () => {
    window.location.href = `/api/export-laporan-excel?tahun=${tahun}`;
  };

  const handlePrint = () => {
    window.open(`/api/cetak-laporan?tahun=${tahun}`, "_blank");
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button
        variant="outline"
        className="gap-2"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4" />
        Cetak Ringkasan
      </Button>
      {currentUser?.role !== "PENGGUNA" && (
        <Button className="gap-2 shadow-lg" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      )}
    </div>
  );
}
