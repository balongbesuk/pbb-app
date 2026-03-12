"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, MapPin } from "lucide-react";
import { updateWpRegionBulk } from "@/app/actions/tax-update-actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { AvailableFilters } from "@/types/app";

interface BulkRegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  availableFilters: AvailableFilters;
  onSuccess: () => void;
}

export function BulkRegionDialog({
  open,
  onOpenChange,
  selectedIds,
  availableFilters,
  onSuccess,
}: BulkRegionDialogProps) {
  const queryClient = useQueryClient();
  const [dusun, setDusun] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (!dusun && !rt && !rw) {
      toast.error("Pilih dusun, RT, atau RW yang ingin diubah");
      return;
    }

    // Normalize RT/RW
    const normalizeNum = (val: string) => {
      if (!val) return val;
      const num = val.replace(/\D/g, "");
      if (!num) return "";
      return num.padStart(2, "0").slice(-2);
    };

    const finalRt = normalizeNum(rt);
    const finalRw = normalizeNum(rw);

    setIsLoading(true);
    const res = await updateWpRegionBulk(selectedIds, dusun || null, finalRt || null, finalRw || null);
    if (res.success) {
      toast.success(`Berhasil memperbarui wilayah untuk ${res.count} data`);
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
      onSuccess();
      onOpenChange(false);
    } else {
      toast.error("Gagal update masal: " + res.message);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-none p-0 shadow-2xl overflow-hidden bg-white dark:bg-zinc-950">
        <div className="bg-blue-600/5 dark:bg-blue-500/5 p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-blue-600/20">
                <MapPin className="text-white h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-black tracking-tight">
                  Update Wilayah Masal
                </DialogTitle>
                <p className="text-blue-600/70 text-[10px] font-bold uppercase tracking-widest">
                  {selectedIds.length} Data Objek Pajak
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-6 p-6">
          <div className="bg-amber-50/50 border-amber-200/50 rounded-2xl border p-4 dark:bg-amber-950/10 dark:border-amber-900/30">
            <p className="text-amber-700 dark:text-amber-400 text-[11px] font-bold leading-relaxed italic">
              "Isi bagian yang ingin diubah saja. Kolom yang dibiarkan kosong tidak akan mengubah data lama."
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-foreground/60 px-1 text-[10px] font-black uppercase tracking-tighter">
                Pilih Dusun / Lingkungan
              </label>
              <Select value={dusun} onValueChange={(v) => setDusun(v || "")}>
                <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/50 text-sm font-bold transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <SelectValue placeholder="Pilih atau biarkan tetap" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="none" className="text-rose-500 font-bold">--- Kosongkan Dusun ---</SelectItem>
                  {(availableFilters.dusunRefs || availableFilters.dusun).map((d: string) => (
                    <SelectItem key={d} value={d} className="font-medium">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-foreground/60 px-1 text-[10px] font-black uppercase tracking-tighter">
                  Nomor RT
                </label>
                <div className="relative">
                  <Input
                    value={rt}
                    onChange={(e) => setRt(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/50 px-4 font-mono text-base font-bold transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900/50"
                    placeholder="00"
                  />
                  <span className="text-zinc-400 pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase">RT</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-foreground/60 px-1 text-[10px] font-black uppercase tracking-tighter">
                  Nomor RW
                </label>
                <div className="relative">
                  <Input
                    value={rw}
                    onChange={(e) => setRw(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/50 px-4 font-mono text-base font-bold transition-all focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900/50"
                    placeholder="00"
                  />
                  <span className="text-zinc-400 pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase">RW</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-12 flex-1 rounded-2xl text-sm font-bold transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Batalkan
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isLoading}
              className="bg-blue-600 shadow-blue-600/20 h-12 flex-1 rounded-2xl text-sm font-black text-white shadow-xl transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Update Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
