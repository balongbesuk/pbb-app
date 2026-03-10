"use client";

import { Save, DatabaseZap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getVillageConfig, updateVillageConfig } from "@/app/actions/settings-actions";

export function TaxConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tahun, setTahun] = useState(2026);
  const [rawConfig, setRawConfig] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const data = await getVillageConfig();
      setTahun(data.tahunPajak);
      setRawConfig(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateVillageConfig({
      ...rawConfig,
      tahunPajak: tahun,
    });
    if (res.success) {
      toast.success("Konfigurasi sistem diperbarui");
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <Card className="glass border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseZap className="text-primary h-5 w-5" />
          Konfigurasi Pajak
        </CardTitle>
        <CardDescription>Atur pengaturan bawaan untuk tahun fiskal dan notifikasi.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tahun-aktif">Tahun Pajak Aktif Target</Label>
            <Input
              id="tahun-aktif"
              type="number"
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="max-w-xs bg-white/50 dark:bg-slate-900/50"
            />
          </div>
          <div className="pt-2">
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Perbarui Konfigurasi
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
