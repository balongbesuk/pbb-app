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
  SelectValue 
} from "@/components/ui/select";
import { MapPin, Plus, Trash2, Loader2, Zap } from "lucide-react";
import { getDusuns, getRegionOtomations, addRegionOtomation, deleteRegionOtomation } from "@/app/actions/settings-actions";
import { toast } from "sonner";

export function RegionOtomationManager() {
  const [dusuns, setDusuns] = useState<{ id: string; name: string }[]>([]);
  const [mappings, setMappings] = useState<{ id: string; code: string; dusun: string; type: string }[]>([]);
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
          <Zap className="w-5 h-5 text-amber-500" />
          Otomasi Wilayah ke Dusun
        </CardTitle>
        <CardDescription>
          Tentukan aturan otomatis: jika alamat mengandung RT atau RW tertentu, maka otomatis masuk Dusun tertentu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <Select value={type} onValueChange={(val: any) => setType(val)}>
            <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RW">RW (Default)</SelectItem>
              <SelectItem value="RT">RT (Khusus)</SelectItem>
            </SelectContent>
          </Select>

          <Input 
            placeholder={`No ${type} (Misal: 001)`} 
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="bg-white/50 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-gray-500"
          />
          
          <Select value={selectedDusun} onValueChange={(val) => setSelectedDusun(val || "")}>
            <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 dark:text-white">
              <SelectValue placeholder="Pilih Dusun..." />
            </SelectTrigger>
            <SelectContent>
              {dusuns.map(d => (
                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button type="submit" disabled={adding} className="gap-2">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Simpan
          </Button>
        </form>

        <div className="space-y-2 mt-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Aturan Aktif</Label>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : mappings.length === 0 ? (
            <p className="text-sm text-center py-4 text-muted-foreground italic">Belum ada aturan pemetaan.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {mappings.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10 group animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1">
                        <div className={`px-2 py-1 ${m.type === 'RW' ? 'bg-primary' : 'bg-emerald-600'} text-primary-foreground text-[10px] font-bold rounded`}>
                          {m.type} {m.code}
                        </div>
                     </div>
                     <span className="text-muted-foreground">→</span>
                     <div className="flex items-center gap-1.5 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {m.dusun}
                     </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    onClick={() => handleDelete(m.id)}
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
