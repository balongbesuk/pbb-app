"use client";

import { Download, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RestoreAssignmentsButton } from "./restore-assignments-button";

import { RestoreDatabaseButton } from "./restore-database-button";

export function BackupToolCard() {
  return (
    <Card className="glass border-none shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <DatabaseZap className="w-20 h-20" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg">Backup & Restore Sistem</CardTitle>
        <CardDescription>Simpan dan pulihkan data Wajib Pajak, pengguna, dan penugasan kapan saja.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-60">Ekspor Excel</p>
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/20 hover:bg-primary/5"
              onClick={() => window.open("/api/backup-assignments?tahun=2026", "_blank")}
            >
              <Download className="w-4 h-4" />
              Backup Penugasan
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-60">Impor Excel</p>
            <RestoreAssignmentsButton tahun={2026} />
            <p className="text-[10px] text-muted-foreground leading-tight italic">
              *Gunakan file hasil backup penugasan sebelumnya untuk memulihkan alokasi penarik secara masal.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
              <DatabaseZap className="w-3 h-3" /> SELURUH BASIS DATA (ZIP)
            </p>
            <Button
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold"
              onClick={() => window.open("/api/backup", "_blank")}
            >
              <Download className="w-4 h-4" />
              Backup Database
            </Button>

            <RestoreDatabaseButton />

            <p className="text-[10px] text-muted-foreground leading-tight italic">
              *Direkomendasikan melakukan Backup ZIP setiap minggu. Jika Anda memulihkan (Restore) dari file ZIP, seluruh data saat ini akan terhapus dan digantikan dengan data saat backup dilakukan.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
