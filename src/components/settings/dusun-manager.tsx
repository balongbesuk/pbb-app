"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react";
import { getDusuns, addDusun, deleteDusun } from "@/app/actions/settings-actions";
import { toast } from "sonner";

type Dusun = { id: string; name: string };

export function DusunManager() {
  // ─── All state declarations at the top ────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [dusuns, setDusuns] = useState<Dusun[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<Dusun | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const fetchDusuns = useCallback(async () => {
    setLoading(true);
    const data = await getDusuns();
    setDusuns(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchDusuns();
  }, [fetchDusuns]);

  // ─── Guard: hydration ──────────────────────────────────────────────────────
  if (!mounted) return null;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    setAdding(true);
    const res = await addDusun(trimmed);
    if (res.success) {
      toast.success("Dusun berhasil ditambahkan");
      setNewName("");
      await fetchDusuns();
      // Trigger refresh for other components (RegionOtomationManager)
      window.dispatchEvent(new CustomEvent("dusun-updated"));
    } else {
      toast.error(res.message ?? "Gagal menambahkan dusun");
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!selectedToDelete) return;

    setDeleting(true);
    const res = await deleteDusun(selectedToDelete.id);
    if (res.success) {
      toast.success(`Dusun "${selectedToDelete.name}" berhasil dihapus`);
      setSelectedToDelete(null);
      await fetchDusuns();
      // Trigger refresh for other components (RegionOtomationManager)
      window.dispatchEvent(new CustomEvent("dusun-updated"));
    } else {
      toast.error(res.message ?? "Gagal menghapus dusun");
    }
    setDeleting(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-50 px-6 pt-6 pb-5 dark:border-zinc-800/60">
          <CardTitle className="flex items-center gap-3 text-lg font-bold tracking-tight">
            <div className="bg-primary/5 rounded-xl p-2">
              <MapPin className="text-primary h-5 w-5" />
            </div>
            Referensi Dusun
          </CardTitle>
          <CardDescription className="text-muted-foreground/70 mt-1 text-xs font-medium">
            Kelola daftar nama dusun untuk deteksi otomatis alamat saat upload Excel.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* ─── Add form ─────────────────────────────────────────────────── */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Nama dusun baru..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={adding}
              className="h-10 rounded-xl border-zinc-200 bg-zinc-50 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
            <Button
              type="submit"
              disabled={adding || !newName.trim()}
              className="h-10 gap-2 rounded-xl px-5 font-bold"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </Button>
          </form>

          {/* ─── List ─────────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <Label className="text-muted-foreground/50 px-1 text-xs font-black tracking-[0.2em] uppercase">
              Daftar Dusun Terdaftar
            </Label>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="text-primary/20 h-8 w-8 animate-spin" />
              </div>
            ) : dusuns.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-zinc-100 p-8 text-center dark:border-zinc-800">
                <MapPin className="text-muted-foreground/20 mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm font-medium italic">
                  Belum ada dusun terdaftar.
                </p>
                <p className="text-muted-foreground/50 mt-1 text-xs">
                  Tambahkan dusun pertama menggunakan form di atas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {dusuns.map((d) => (
                  <div
                    key={d.id}
                    className="group hover:border-primary/20 hover:bg-primary/[0.02] flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-primary/5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
                        <MapPin className="text-primary h-4 w-4" />
                      </div>
                      <span className="truncate text-sm font-bold tracking-tight">{d.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus dusun ${d.name}`}
                      className="text-muted-foreground/30 ml-2 h-8 w-8 shrink-0 rounded-lg transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                      onClick={() => setSelectedToDelete(d)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Premium Confirmation Dialog ────────────────────────────────────── */}
      <Dialog
        open={!!selectedToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setSelectedToDelete(null);
        }}
      >
        <DialogContent className="overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[400px]">
          {/* Header strip */}
          <div className="flex flex-col items-center gap-4 bg-rose-50 px-8 pt-8 pb-6 dark:bg-rose-950/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-white shadow-sm dark:border-rose-900 dark:bg-rose-950/30">
              <Trash2 className="h-7 w-7 text-rose-500" />
            </div>
            <DialogHeader className="space-y-1 p-0 text-center">
              <DialogTitle className="text-lg font-bold">Hapus Dusun?</DialogTitle>
              <DialogDescription className="text-muted-foreground/80 text-sm leading-relaxed">
                Anda akan menghapus{" "}
                <strong className="text-foreground">{selectedToDelete?.name}</strong>.
                <br />
                Deteksi otomatis untuk nama ini akan dinonaktifkan.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col justify-end gap-3 bg-white px-8 py-6 sm:flex-row dark:bg-zinc-950">
            <Button
              variant="outline"
              onClick={() => setSelectedToDelete(null)}
              disabled={deleting}
              className="h-10 rounded-xl border-zinc-200 px-6 font-bold dark:border-zinc-800"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 gap-2 rounded-xl px-6 font-bold shadow-sm shadow-rose-500/20"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
