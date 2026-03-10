"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAllTaxData } from "@/app/actions/settings-actions";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

export function DeleteDataButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="destructive" className="mt-2 w-full" disabled>
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
      setConfirmText("");
    } else {
      toast.error(`Gagal menghapus data: ${res.message}`);
    }
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setConfirmText("");
      }}
    >
      <DialogTrigger
        render={
          <Button variant="destructive" className="mt-2 w-full">
            Hapus Seluruh Data
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            Konfirmasi Hapus Data
          </DialogTitle>
          <DialogDescription className="text-foreground/70 pt-1">
            Apakah Anda yakin ingin menghapus <strong>seluruh data pajak</strong> tahun berjalan
            dari sistem?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="rounded-md bg-rose-100 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
            Data riwayat pembayaran, nama wajib pajak, tagihan, dan alokasi penagih akan{" "}
            <strong>hilang selamanya</strong> dan tidak dapat dikembalikan.
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="confirm-delete" className="text-foreground text-xs font-bold">
              Ketik <span className="font-bold select-all">HAPUS SEMUA DATA</span> untuk konfirmasi:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Masukkan teks konfirmasi..."
              className="rounded-xl border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <DialogClose
            render={
              <Button variant="outline" disabled={loading}>
                Batal
              </Button>
            }
          />
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== "HAPUS SEMUA DATA"}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ya, Bersihkan Database
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
