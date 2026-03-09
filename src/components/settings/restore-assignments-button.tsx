"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { restoreAssignments } from "@/app/actions/tax-actions";
import { toast } from "sonner";
import { Upload, Loader2, History, CheckCircle2 } from "lucide-react";
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
  const [count, setCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Apakah Anda yakin ingin memulihkan pembagian tugas dari file backup ini? Area tugas penarik mungkin akan berubah sesuai isi file.")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await restoreAssignments(formData, tahun);
      console.log("Restore Result Client:", result);
      if (result.success) {
        setCount(result.count || 0);
        setShowSuccess(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(`Gagal memulihkan: ${result.message}`);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem saat memulihkan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".xlsx"
      />
      
      <Button 
        variant="outline" 
        className="w-full gap-2 border-primary/20 hover:bg-primary/5"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
        Restore Penugasan
      </Button>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Proses Berhasil
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Data penugasan telah berhasil dipulihkan secara massal ke dalam sistem.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Data Terpindah:</span>
              <span className="text-lg font-bold text-green-700 dark:text-green-400">{count} Baris</span>
            </div>
            <p className="text-[11px] text-green-600 dark:text-green-500 mt-2">
              *Hanya NOP yang sudah ada di sistem (telah di-upload) yang akan mendapatkan penugasan.
            </p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" className="w-full">Selesai</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
