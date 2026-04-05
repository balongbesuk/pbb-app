"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { restoreAssignments } from "@/app/actions/tax-actions";
import { toast } from "sonner";
import { Loader2, History, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export function RestoreAssignmentsButton({ tahun }: { tahun: number }) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [count, setCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setConfirmText("");
    setIsConfirmOpen(true);
  };

  const processRestore = async () => {
    if (!selectedFile) return;

    setIsConfirmOpen(false);
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const result = await restoreAssignments(formData, tahun);
      if (result.success) {
        setCount(result.count || 0);
        setShowSuccess(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(`Gagal memulihkan: ${result.message}`);
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memulihkan data");
    } finally {
      setLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelRestore = () => {
    setIsConfirmOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .csv"
      />

      <Button
        variant="outline"
        className="border-primary/20 hover:bg-primary/5 w-full gap-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
        Restore Penugasan
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => !open && cancelRestore()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Pemulihan Penugasan
            </DialogTitle>
            <DialogDescription className="text-foreground/70 pt-1">
              Anda akan mengimpor data penugasan dari file Excel/CSV. Tindakan ini berpotensi{" "}
              <strong>mengubah area tugas penarik pajak saat ini</strong> sesuai dengan isi file
              tersebut.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-xs font-semibold">
              Peringatan: Seluruh data penugasan yang ditimpa tidak dapat dikembalikan sesudahnya.
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="confirm-penugasan" className="text-foreground text-xs font-bold">
                Ketik <span className="font-bold select-all">RESTORE PENUGASAN</span> untuk
                konfirmasi:
              </Label>
              <Input
                id="confirm-penugasan"
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
              onClick={processRestore}
              disabled={confirmText !== "RESTORE PENUGASAN" || loading}
              className="w-full sm:w-auto"
            >
              Saya mengerti, pulihkan penugasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Proses Berhasil
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Data penugasan telah berhasil dipulihkan secara massal ke dalam sistem.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-green-100 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Data Terpindah:</span>
              <span className="text-lg font-bold text-green-700 dark:text-green-400">
                {count} Baris
              </span>
            </div>
            <p className="mt-2 text-[11px] text-green-600 dark:text-green-500">
              *Hanya NOP yang sudah ada di sistem (telah di-upload) yang akan mendapatkan penugasan.
            </p>
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" className="w-full">
                  Selesai
                </Button>
              }
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
