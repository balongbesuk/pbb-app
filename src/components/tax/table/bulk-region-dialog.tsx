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

interface BulkRegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  availableFilters: any;
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

    setIsLoading(true);
    const res = await updateWpRegionBulk(selectedIds, dusun || null, rt || null, rw || null);
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
      <DialogContent className="glass border-primary/20 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="text-primary h-5 w-5" />
            Perbaikan Wilayah Masal ({selectedIds.length} data)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4 text-sm">
          <p className="text-muted-foreground mb-2 text-xs italic">
            Isi bidang yang ingin diubah secara bersamaan untuk data terpilih. Bidang yang kosong
            tidak akan diubah.
          </p>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase opacity-60">Dusun</label>
              <Select value={dusun} onValueChange={(v) => setDusun(v || "")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Dusun (Opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">--- Kosongkan ---</SelectItem>
                  {(availableFilters.dusunRefs || availableFilters.dusun).map((d: string) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase opacity-60">RT</label>
                <Input
                  value={rt}
                  onChange={(e) => setRt(e.target.value)}
                  className="h-9 text-xs"
                  placeholder="Contoh: 01"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase opacity-60">RW</label>
                <Input
                  value={rw}
                  onChange={(e) => setRw(e.target.value)}
                  className="h-9 text-xs"
                  placeholder="Contoh: 04"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="shadow-primary/20 gap-1.5 font-bold shadow-md"
              onClick={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Terapkan Wilayah
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
