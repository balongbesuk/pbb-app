"use client";

import { Download, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RestoreAssignmentsButton } from "./restore-assignments-button";

export function BackupToolCard() {
  return (
    <Card className="glass border-none shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <DatabaseZap className="w-20 h-20" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg">Pencadangan Data</CardTitle>
        <CardDescription>Simpan rekapan pembagian tugas penarik ke Excel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-60">Ekspor</p>
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
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-60">Impor / Pulihkan</p>
            <RestoreAssignmentsButton tahun={2026} />
            <p className="text-[10px] text-muted-foreground leading-tight italic">
              *Gunakan file hasil backup penugasan sebelumnya untuk memulihkan alokasi penarik secara masal.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
