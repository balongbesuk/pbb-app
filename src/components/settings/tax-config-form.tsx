"use client";

import { Save, DatabaseZap, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getVillageConfig, updateVillageConfig } from "@/app/actions/settings-actions";

export function TaxConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tahun, setTahun] = useState(2026);
  const [jatuhTempo, setJatuhTempo] = useState("31 Agustus");
  const [bapendaUrl, setBapendaUrl] = useState("");
  const [isJombangBapenda, setIsJombangBapenda] = useState(false);
  const [enableBapendaSync, setEnableBapendaSync] = useState(false);
  const [showNominal, setShowNominal] = useState(false);
  const [enableArchive, setEnableArchive] = useState(false);
  const [archiveOnlyLunas, setArchiveOnlyLunas] = useState(false);
  const [rawConfig, setRawConfig] = useState<any>(null);

  const DEFAULT_JOMBANG_URL = "https://bapenda.jombangkab.go.id/cek-bayar/ceknopbayar-jmb.kab?module=pbb";

  useEffect(() => {
    async function load() {
      const data = await getVillageConfig();
      setTahun(data.tahunPajak);
      setJatuhTempo(data.jatuhTempo || "31 Agustus");
      setBapendaUrl(data.bapendaUrl || "");
      setIsJombangBapenda(data.isJombangBapenda ?? false);
      setEnableBapendaSync(data.enableBapendaSync ?? false);
      setShowNominal(!!data.showNominalPajak);
      setEnableArchive(data.enableDigitalArchive ?? false);
      setArchiveOnlyLunas(data.archiveOnlyLunas ?? false);
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
      jatuhTempo: jatuhTempo,
      bapendaUrl: bapendaUrl,
      isJombangBapenda: isJombangBapenda,
      enableBapendaSync: enableBapendaSync,
      showNominalPajak: !!showNominal,
      enableDigitalArchive: !!enableArchive,
      archiveOnlyLunas: !!archiveOnlyLunas,
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
        <CardDescription>Atur pengaturan bawaan untuk tahun fiskal dan tampilan publik.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tahun-aktif">Tahun Pajak Aktif Target</Label>
              <Input
                id="tahun-aktif"
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value) || 2026)}
                className="bg-white/50 dark:bg-[#111827]/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jatuh-tempo">Tanggal Jatuh Tempo</Label>
              <Input
                id="jatuh-tempo"
                type="date"
                value={jatuhTempo}
                onChange={(e) => setJatuhTempo(e.target.value)}
                className="bg-white/50 dark:bg-[#111827]/50"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border bg-primary/5 p-4 dark:bg-primary/10">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-jombang">Sistem Cek Pajak Jombang</Label>
                <p className="text-[10px] text-muted-foreground">Aktifkan fitur auto-fill NOP khusus Kabupaten Jombang.</p>
              </div>
              <Checkbox 
                id="is-jombang" 
                checked={isJombangBapenda} 
                onCheckedChange={(checked) => setIsJombangBapenda(!!checked)}
              />
            </div>

            <div className="flex items-center justify-between border-t border-primary/10 pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="enable-sync">Auto-Sync Bapenda (Real-Time)</Label>
                <p className="text-[10px] text-muted-foreground">Izinkan sistem mencocokkan data pelunasan secara otomatis ke website Kabupaten Jombang.</p>
              </div>
              <Checkbox 
                id="enable-sync" 
                checked={enableBapendaSync} 
                onCheckedChange={(checked) => setEnableBapendaSync(!!checked)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bapenda-url">URL Website Bapenda</Label>
                {isJombangBapenda && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="xs" 
                    onClick={() => setBapendaUrl(DEFAULT_JOMBANG_URL)}
                    className="text-[10px] uppercase font-bold text-primary"
                  >
                    Reset ke Default Jombang
                  </Button>
                )}
              </div>
              <Input
                id="bapenda-url"
                type="url"
                placeholder="https://cekpajak.bapenda.kabupaten.go.id"
                value={bapendaUrl}
                onChange={(e) => setBapendaUrl(e.target.value)}
                className="bg-white/50 dark:bg-[#111827]/50"
              />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {isJombangBapenda 
                  ? "Sistem akan otomatis membedah NOP untuk website Jombang." 
                  : "Link akan dibuka langsung tanpa auto-fill NOP (atau manual)."}
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4">
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-sm font-bold">
                {showNominal ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-rose-500" />}
                Tampilkan Nominal Pajak di Publik
              </Label>
              <p className="text-muted-foreground text-[10px]">
                Jika aktif, warga dapat melihat total tagihan saat cek status PBB.
              </p>
            </div>
            <Checkbox
              checked={!!showNominal}
              onCheckedChange={(checked) => setShowNominal(!!checked)}
              className="size-5 rounded-lg border-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4">
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-sm font-bold">
                  {enableArchive ? <Eye className="h-4 w-4 text-blue-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  Arsip Digital Publik
                </Label>
                <p className="text-muted-foreground text-[10px]">
                  Aktifkan fitur lihat E-SPPT untuk warga di portal publik.
                </p>
              </div>
              <Checkbox
                checked={!!enableArchive}
                onCheckedChange={(checked) => setEnableArchive(!!checked)}
                className="size-5 rounded-lg border-2"
              />
            </div>

            <div className={`transition-all duration-300 ${!enableArchive ? 'opacity-50 pointer-events-none' : ''} bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4`}>
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-sm font-bold">
                  Hanya Tampilkan Jika Lunas
                </Label>
                <p className="text-muted-foreground text-[10px]">
                  E-SPPT hanya bisa dilihat/download jika status pembayaran sudah LUNAS.
                </p>
              </div>
              <Checkbox
                disabled={!enableArchive}
                checked={!!archiveOnlyLunas}
                onCheckedChange={(checked) => setArchiveOnlyLunas(!!checked)}
                className="size-5 rounded-lg border-2"
              />
            </div>
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
