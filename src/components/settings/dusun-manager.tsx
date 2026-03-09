"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react";
import { getDusuns, addDusun, deleteDusun } from "@/app/actions/settings-actions";
import { toast } from "sonner";

export function DusunManager() {
  const [dusuns, setDusuns] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchDusuns = async () => {
    const data = await getDusuns();
    setDusuns(data);
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchDusuns();
  }, []);

  if (!mounted) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setAdding(true);
    const res = await addDusun(newName);
    if (res.success) {
      toast.success("Dusun berhasil ditambahkan");
      setNewName("");
      fetchDusuns();
    } else {
      toast.error(res.message);
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus dusun ini? Data pajak yang sudah ter-mapping tidak akan terhapus, namun deteksi otomatis di masa depan untuk nama ini akan mati.")) return;
    
    const res = await deleteDusun(id);
    if (res.success) {
      toast.success("Dusun dihapus");
      fetchDusuns();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Card className="glass border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Referensi Dusun
        </CardTitle>
        <CardDescription>
          Kelola daftar nama dusun untuk deteksi otomatis alamat saat upload Excel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input 
            placeholder="Masukkan nama dusun baru..." 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-white/50 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-gray-500"
          />
          <Button type="submit" disabled={adding} className="gap-2">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah
          </Button>
        </form>

        <div className="space-y-2 mt-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Daftar Dusun Terdaftar</Label>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : dusuns.length === 0 ? (
            <p className="text-sm text-center py-4 text-muted-foreground italic">Belum ada dusun terdaftar.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dusuns.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/50 group">
                  <span className="font-medium text-sm">{d.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    onClick={() => handleDelete(d.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
