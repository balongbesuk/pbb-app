"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Plus, Trash2, Loader2, Zap } from "lucide-react";
import {
  getDusuns,
  getRegionOtomations,
  addRegionOtomation,
  deleteRegionOtomation,
} from "@/app/actions/settings-actions";
import { toast } from "sonner";

export function RegionOtomationManager() {
  const [dusuns, setDusuns] = useState<{ id: string; name: string }[]>([]);
  const [mappings, setMappings] = useState<
    { id: string; code: string; dusun: string; type: string }[]
  >([]);
  const [type, setType] = useState<"RT" | "RW">("RW");
  const [newCode, setNewCode] = useState("");
  const [selectedDusun, setSelectedDusun] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchData = async () => {
    const [d, m] = await Promise.all([getDusuns(), getRegionOtomations()]);
    setDusuns(d);
    setMappings(m);
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchData();

    // Listen for updates from DusunManager
    const handleDusunUpdate = () => {
      fetchData();
    };

    window.addEventListener("dusun-updated", handleDusunUpdate);
    return () => window.removeEventListener("dusun-updated", handleDusunUpdate);
  }, []);

  if (!mounted) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !selectedDusun) {
      toast.error(`Pilih ${type} dan Dusun`);
      return;
    }

    setAdding(true);
    const res = await addRegionOtomation(type, newCode, selectedDusun);
    if (res.success) {
      toast.success(`Aturan ${type} ${newCode} -> ${selectedDusun} ditambahkan`);
      setNewCode("");
      fetchData();
    } else {
      toast.error(res.message);
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus aturan pemetaan ini?")) return;
    
    const res = await deleteRegionOtomation(id);
    if (res.success) {
      toast.success("Aturan dihapus");
      fetchData();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Card className="glass border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Otomasi Wilayah ke Dusun
        </CardTitle>
        <CardDescription>
          Tentukan aturan otomatis: jika alamat mengandung RT atau RW tertentu, maka otomatis masuk
          Dusun tertentu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Select value={type} onValueChange={(val) => val && setType(val as "RT" | "RW")}>
            <SelectTrigger className="bg-white/50 dark:bg-[#111827]/50 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RW">RW (Default)</SelectItem>
              <SelectItem value="RT">RT (Khusus)</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder={`No ${type} (Misal: 01)`}
            value={newCode}
            maxLength={2}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ""); // Hanya angka
              setNewCode(val);
            }}
            className="bg-white/50 dark:bg-[#111827]/50 dark:text-white dark:placeholder:text-gray-500"
          />

          <Select value={selectedDusun} onValueChange={(val) => setSelectedDusun(val || "")}>
            <SelectTrigger className="bg-white/50 dark:bg-[#111827]/50 dark:text-white">
              <SelectValue placeholder="Pilih Dusun..." />
            </SelectTrigger>
            <SelectContent>
              {dusuns.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" disabled={adding} className="gap-2">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Simpan
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          <Label className="text-muted-foreground text-xs tracking-wider uppercase">
            Aturan Aktif
          </Label>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : mappings.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm italic">
              Belum ada aturan pemetaan.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {mappings.map((m) => (
                <div
                  key={m.id}
                  className="bg-primary/5 border-primary/10 group animate-in fade-in slide-in-from-top-1 flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div
                        className={`px-2 py-1 ${m.type === "RW" ? "bg-primary" : "bg-emerald-600"} text-primary-foreground rounded text-[10px] font-bold`}
                      >
                        {m.type} {m.code}
                      </div>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <MapPin className="text-primary h-3.5 w-3.5" />
                      {m.dusun}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus aturan ${m.type} ${m.code} → ${m.dusun}`}
                    className="text-muted-foreground/40 h-8 w-8 rounded-lg transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                    onClick={() => handleDelete(m.id)}
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
  );
}
