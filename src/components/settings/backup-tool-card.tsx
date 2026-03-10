"use client";

import { Download, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RestoreAssignmentsButton } from "./restore-assignments-button";

import { RestoreDatabaseButton } from "./restore-database-button";

export function BackupToolCard() {
  return (
    <Card className="glass relative overflow-hidden border-none shadow-lg">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <DatabaseZap className="h-20 w-20" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg">Backup & Restore Sistem</CardTitle>
        <CardDescription>
          Simpan dan pulihkan data Wajib Pajak, pengguna, dan penugasan kapan saja.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase opacity-60">
              Ekspor Excel
            </p>
            <Button
              variant="outline"
              className="border-primary/20 hover:bg-primary/5 w-full gap-2"
              onClick={() => window.open("/api/backup-assignments?tahun=2026", "_blank")}
            >
              <Download className="h-4 w-4" />
              Backup Penugasan
            </Button>
          </div>

          <div className="border-border/50 space-y-2 border-t pt-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase opacity-60">
              Impor Excel
            </p>
            <RestoreAssignmentsButton tahun={2026} />
            <p className="text-muted-foreground text-[10px] leading-tight italic">
              *Gunakan file hasil backup penugasan sebelumnya untuk memulihkan alokasi penarik
              secara masal.
            </p>
          </div>

          <div className="border-border/50 space-y-4 border-t pt-4">
            <p className="flex items-center gap-1 text-xs font-bold tracking-wider text-rose-600 uppercase opacity-80 dark:text-rose-400">
              <DatabaseZap className="h-3 w-3" /> SELURUH BASIS DATA (ZIP)
            </p>
            <Button
              className="w-full gap-2 bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-700"
              onClick={() => window.open("/api/backup", "_blank")}
            >
              <Download className="h-4 w-4" />
              Backup Database
            </Button>

            <RestoreDatabaseButton />

            <p className="text-muted-foreground text-[10px] leading-tight italic">
              *Direkomendasikan melakukan Backup ZIP setiap minggu. Jika Anda memulihkan (Restore)
              dari file ZIP, seluruh data saat ini akan terhapus dan digantikan dengan data saat
              backup dilakukan.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
