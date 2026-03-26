"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DatabaseZap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RestoreDatabaseButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.endsWith(".zip")) {
      toast.error("Format file tidak valid. Harap unggah file .zip hasil backup.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedBackupFile(file);
    setConfirmText("");
    setIsDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackupFile) return;

    setIsDialogOpen(false);
    setIsUploading(true);
    const toastId = toast.loading("Memulihkan database... Mohon tunggu.");

    try {
      const formData = new FormData();
      formData.append("file", selectedBackupFile);

      const response = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Database berhasil dipulihkan", { id: toastId });
        // Memberi waktu aplikasi untuk restart/sync
        setTimeout(() => {
          window.location.href = "/login"; // Force reload and login again
        }, 2000);
      } else {
        throw new Error(result.error || "Gagal memulihkan database");
      }
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsUploading(false);
      setSelectedBackupFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelRestore = () => {
    setIsDialogOpen(false);
    setSelectedBackupFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".zip"
        className="hidden"
      />
      <Button
        variant="destructive"
        className="w-full gap-2 bg-rose-600/90 font-bold text-white shadow-md hover:bg-rose-600"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <DatabaseZap className="h-4 w-4" />
        )}
        Restore Database
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && cancelRestore()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Pemulihan Data
            </DialogTitle>
            <DialogDescription className="text-foreground/70 pt-1">
              Anda akan memulihkan database dari file backup. Tindakan ini akan{" "}
              <strong>menghapus seluruh data yang ada saat ini secara permanen</strong> dan
              menggantikannya dengan versi backup.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-xs font-semibold">
              Peringatan: Data yang sudah terhapus tidak dapat dikembalikan sesudahnya.
            </div>

            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md p-3 text-[10px] leading-relaxed font-semibold border border-amber-500/20">
              Catatan: Setelah pemulihan, sistem akan otomatis melakukan sinkronisasi database dan mereset password administrator ke <strong>Konfigurasi Default Server (ENV)</strong> untuk keamanan akses.
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="confirm-text" className="text-foreground text-xs font-bold">
                Ketik <span className="font-bold select-all">RESTORE DATABASE</span> untuk
                konfirmasi:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Masukkan teks konfirmasi..."
                className="rounded-xl border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={cancelRestore} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRestore}
              disabled={confirmText !== "RESTORE DATABASE"}
              className="w-full sm:w-auto"
            >
              Saya mengerti, pulihkan data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
