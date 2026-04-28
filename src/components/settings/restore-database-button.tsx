"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatabaseZap, AlertTriangle, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RestoreDatabaseButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error("Pilih file backup ZIP terlebih dahulu.");
      return;
    }

    const confirmRestore = window.confirm(
      "PERINGATAN: Restore akan menimpa database dan semua file upload saat ini. Proses ini tidak dapat dibatalkan. Lanjutkan?"
    );

    if (!confirmRestore) return;

    setIsRestoring(true);
    const toastId = toast.loading("Memulai proses restore database...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan restore.");
      }

      toast.success("Database berhasil dipulihkan!", { id: toastId });
      toast.info("Aplikasi akan dimuat ulang untuk menerapkan perubahan.");
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal memulihkan database.", { id: toastId });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        className="w-full gap-2 bg-rose-600/90 font-bold text-white shadow-md hover:bg-rose-600"
        onClick={() => setIsDialogOpen(true)}
      >
        <DatabaseZap className="h-4 w-4" />
        Restore Database
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !isRestoring && setIsDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Restore Database
            </DialogTitle>
            <DialogDescription className="text-foreground/70 pt-1">
              Pilih file backup (.zip) yang ingin dipulihkan. Restore akan mengganti seluruh database dan file lampiran yang ada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-xs font-semibold">
              PENTING: Jangan tutup browser atau matikan server selama proses restore berlangsung.
            </div>

            <div className="space-y-3">
              <label 
                htmlFor="db-restore-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                  <p className="text-sm text-zinc-500 font-medium">
                    {selectedFile ? selectedFile.name : "Klik untuk pilih file backup ZIP"}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">Maksimal 200MB</p>
                </div>
                <input 
                  id="db-restore-file" 
                  type="file" 
                  accept=".zip" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isRestoring}
                />
              </label>
            </div>
          </div>

          <DialogFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)} 
              disabled={isRestoring}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestore}
              disabled={!selectedFile || isRestoring}
              className="w-full sm:w-auto gap-2"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Mulai Restore"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
