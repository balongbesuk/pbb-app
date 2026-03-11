"use client";

import { Save, Building, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getVillageConfig, updateVillageConfig } from "@/app/actions/settings-actions";

export function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    namaDesa: "",
    kecamatan: "",
    kabupaten: "",
  });

  useEffect(() => {
    async function load() {
      const data = await getVillageConfig();
      setConfig({
        namaDesa: data.namaDesa,
        kecamatan: data.kecamatan,
        kabupaten: data.kabupaten,
      });
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateVillageConfig(config);
    if (res.success) {
      toast.success("Profil desa berhasil diperbarui");
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="glass border-none shadow-lg">
        <CardContent className="flex justify-center p-8">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="text-primary h-5 w-5" />
          Profil Instansi / Desa
        </CardTitle>
        <CardDescription>
          Informasi ini akan ditampilkan pada kop surat eksport PDF dan laporan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nama-desa">Nama Desa</Label>
              <Input
                id="nama-desa"
                value={config.namaDesa}
                onChange={(e) => setConfig({ ...config, namaDesa: e.target.value })}
                className="bg-white/50 dark:bg-[#111827]/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Input
                id="kecamatan"
                value={config.kecamatan}
                onChange={(e) => setConfig({ ...config, kecamatan: e.target.value })}
                className="bg-white/50 dark:bg-[#111827]/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kabupaten">Kabupaten / Kota</Label>
            <Input
              id="kabupaten"
              value={config.kabupaten}
              onChange={(e) => setConfig({ ...config, kabupaten: e.target.value })}
              className="bg-white/50 dark:bg-[#111827]/50"
            />
          </div>
          <div className="pt-2">
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Profil
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
