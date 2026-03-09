"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { deleteAllTaxData } from "@/app/actions/settings-actions";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

export function DeleteDataButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="destructive" className="w-full mt-2" disabled>
        Hapus Seluruh Data
      </Button>
    );
  }

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteAllTaxData();
    if (res.success) {
      toast.success("Database berhasil dikosongkan");
      setOpen(false);
    } else {
      toast.error(`Gagal menghapus data: ${res.message}`);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" className="w-full mt-2">
            Hapus Seluruh Data
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            Konfirmasi Hapus Data
          </DialogTitle>
          <DialogDescription className="pt-2">
            Apakah Anda yakin ingin menghapus <strong>seluruh data pajak</strong> tahun berjalan dari sistem?
            <br/><br/>
            Data riwayat pembayaran, nama wajib pajak, tagihan, dan alokasi penagih akan <strong>hilang selamanya</strong> dan tidak dapat dikembalikan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <DialogClose
            render={
               <Button variant="outline" disabled={loading}>Batal</Button>
            }
          />
          <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Ya, Bersihkan Database
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
