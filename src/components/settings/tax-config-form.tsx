"use client";

import { Save, DatabaseZap, Loader2, Eye, EyeOff, Map, Users, Smartphone, Bell, Settings, Network, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { getVillageConfig, updateVillageConfig } from "@/app/actions/settings-actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function TaxConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tahun, setTahun] = useState(2026);
  const [jatuhTempo, setJatuhTempo] = useState("31 Agustus");
  const [bapendaUrl, setBapendaUrl] = useState("");
  const [bapendaPaymentUrl, setBapendaPaymentUrl] = useState("");
  const [enableBapendaPayment, setEnableBapendaPayment] = useState(true);
  const [bapendaRegionName, setBapendaRegionName] = useState("Bapenda");
  const [isJombangBapenda, setIsJombangBapenda] = useState(false);
  const [enableBapendaSync, setEnableBapendaSync] = useState(false);
  const [showNominal, setShowNominal] = useState(false);
  const [enableArchive, setEnableArchive] = useState(false);
  const [archiveOnlyLunas, setArchiveOnlyLunas] = useState(false);
  const [enablePublicGis, setEnablePublicGis] = useState(true);
  const [showUnpaidGis, setShowUnpaidGis] = useState(false);
  const [enablePbbMobile, setEnablePbbMobile] = useState(true);
  const [adminFee, setAdminFee] = useState(2000);
  const [showReceiptPublic, setShowReceiptPublic] = useState(true);
  const [enablePushNotifications, setEnablePushNotifications] = useState(true);

  const DEFAULT_JOMBANG_URL = "https://bapenda.jombangkab.go.id/cek-bayar/ceknopbayar-jmb.kab?module=pbb";

  useEffect(() => {
    async function load() {
      const data = await getVillageConfig();
      setTahun(data.tahunPajak);
      setJatuhTempo(data.jatuhTempo || "31 Agustus");
      setBapendaUrl(data.bapendaUrl || "");
      setBapendaPaymentUrl(data.bapendaPaymentUrl || "");
      setEnableBapendaPayment(data.enableBapendaPayment ?? true);
      setBapendaRegionName(data.bapendaRegionName || "Bapenda");
      setIsJombangBapenda(data.isJombangBapenda ?? false);
      setEnableBapendaSync(data.enableBapendaSync ?? false);
      setShowNominal(!!data.showNominalPajak);
      setEnableArchive(data.enableDigitalArchive ?? false);
      setArchiveOnlyLunas(data.archiveOnlyLunas ?? false);
      setEnablePublicGis(data.enablePublicGis ?? true);
      setShowUnpaidGis(data.showUnpaidDetailsGis ?? false);
      setEnablePbbMobile(data.enablePbbMobile ?? true);
      setAdminFee(data.adminFee ?? 2000);
      setShowReceiptPublic(data.showReceiptPublic ?? true);
      setEnablePushNotifications(data.enablePushNotifications ?? true);
      setLoading(false);
    }
    load();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Pastikan kita ambil data terbaru
    const latest = await getVillageConfig();
    
    const res = await updateVillageConfig({
      ...latest,
      tahunPajak: tahun,
      jatuhTempo: jatuhTempo,
      bapendaUrl: bapendaUrl,
      bapendaPaymentUrl: bapendaPaymentUrl,
      enableBapendaPayment: enableBapendaPayment,
      bapendaRegionName: bapendaRegionName,
      isJombangBapenda: isJombangBapenda,
      enableBapendaSync: enableBapendaSync,
      showNominalPajak: !!showNominal,
      enableDigitalArchive: !!enableArchive,
      archiveOnlyLunas: !!archiveOnlyLunas,
      enablePublicGis: !!enablePublicGis,
      showUnpaidDetailsGis: !!showUnpaidGis,
      enablePbbMobile: !!enablePbbMobile,
      adminFee: adminFee,
      showReceiptPublic: showReceiptPublic,
      enablePushNotifications: !!enablePushNotifications,
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
          <DatabaseZap className="text-primary h-5 w-5 animate-pulse" />
          Konfigurasi Pajak
        </CardTitle>
        <CardDescription>Kelola parameter tahun fiskal, portal publik, serta sinkronisasi penagihan desa Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-6">
          <Tabs defaultValue="umum" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted/65 p-1 mb-6 rounded-xl border border-primary/5 gap-1">
              <TabsTrigger value="umum" className="gap-2 py-2">
                <Settings className="h-4 w-4" />
                Umum & Biaya
              </TabsTrigger>
              <TabsTrigger value="bapenda" className="gap-2 py-2">
                <Network className="h-4 w-4" />
                Integrasi Bapenda
              </TabsTrigger>
              <TabsTrigger value="publik" className="gap-2 py-2">
                <Globe className="h-4 w-4" />
                Portal & GIS Publik
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-2 py-2">
                <Smartphone className="h-4 w-4" />
                Akses Mobile
              </TabsTrigger>
            </TabsList>

            {/* UNIT 1: UMUM & BIAYA */}
            <TabsContent value="umum" className="space-y-6 outline-none focus:outline-none">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tahun-aktif" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tahun Pajak Aktif Target</Label>
                  <Input
                    id="tahun-aktif"
                    type="number"
                    value={tahun}
                    onChange={(e) => setTahun(parseInt(e.target.value) || 2026)}
                    className="bg-white/50 dark:bg-[#111827]/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jatuh-tempo" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tanggal Jatuh Tempo</Label>
                  <Input
                    id="jatuh-tempo"
                    type="date"
                    value={jatuhTempo}
                    onChange={(e) => setJatuhTempo(e.target.value)}
                    className="bg-white/50 dark:bg-[#111827]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/5 border-primary/10 flex flex-col justify-between rounded-2xl border p-5 gap-3 dark:bg-primary/10">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      Biaya Admin Bawaan (Kwitansi)
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Tentukan nominal biaya layanan/admin tambahan yang otomatis dijumlahkan pada setiap cetakan struk & kwitansi pelunasan PBB.
                    </p>
                  </div>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={adminFee}
                      onChange={(e) => setAdminFee(parseInt(e.target.value) || 0)}
                      className="bg-white/50 dark:bg-[#111827]/50 pl-8 text-sm font-medium"
                      placeholder="2000"
                    />
                  </div>
                </div>

                <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-5 min-h-[108px] dark:bg-primary/10">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      Tampilkan Cetak Kwitansi di Portal Publik
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Jika diaktifkan, warga dapat mengunduh atau mencetak kwitansi pembayaran lunas dari situs pencarian publik.
                    </p>
                  </div>
                  <Checkbox
                    checked={!!showReceiptPublic}
                    onCheckedChange={(checked) => setShowReceiptPublic(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>
              </div>
            </TabsContent>

            {/* UNIT 2: INTEGRASI BAPENDA */}
            <TabsContent value="bapenda" className="space-y-6 outline-none focus:outline-none">
              <div className="space-y-4 rounded-2xl border bg-primary/5 p-5 dark:bg-primary/10 border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-lg">
                    <Label htmlFor="is-jombang" className="font-bold text-sm">Sistem Cek Pajak Jombang</Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Aktifkan parser/pemecah NOP dinamis khusus integrasi sistem Kabupaten Jombang secara bawaan.</p>
                  </div>
                  <Checkbox 
                    id="is-jombang" 
                    checked={isJombangBapenda} 
                    onCheckedChange={(checked) => setIsJombangBapenda(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-primary/10 pt-4">
                  <div className="space-y-0.5 max-w-lg">
                    <Label htmlFor="enable-sync" className="font-bold text-sm">Auto-Sync Bapenda (Real-Time)</Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Izinkan server secara otomatis mencocokkan status pelunasan pajak ke portal Bapenda saat pencarian dilakukan.</p>
                  </div>
                  <Checkbox 
                    id="enable-sync" 
                    checked={enableBapendaSync} 
                    onCheckedChange={(checked) => setEnableBapendaSync(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>

                <div className="space-y-2 border-t border-primary/10 pt-4">
                  <Label htmlFor="bapenda-region" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Nama Daerah Bapenda</Label>
                  <Input
                    id="bapenda-region"
                    placeholder="Misal: Jombang, Surabaya, dsb"
                    value={bapendaRegionName}
                    onChange={(e) => setBapendaRegionName(e.target.value)}
                    className="bg-white/50 dark:bg-[#111827]/50"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    Digunakan untuk label penamaan teks di popup info status pajak.
                  </p>
                </div>

                <div className="space-y-2 border-t border-primary/10 pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bapenda-url" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">URL Website Cek NOP Bapenda</Label>
                    {isJombangBapenda && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="xs" 
                        onClick={() => setBapendaUrl(DEFAULT_JOMBANG_URL)}
                        className="text-[10px] uppercase font-bold text-primary hover:bg-transparent"
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
                      ? "Sistem akan menggunakan API khusus pemecah segmen NOP untuk website Jombang." 
                      : "Alamat eksternal rujukan dinamis untuk cek pajak mandiri."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-primary/10 pt-4">
                  <div className="space-y-0.5 max-w-lg">
                    <Label htmlFor="enable-payment" className="font-bold text-sm">Aktifkan Fitur Pembayaran Online (EPAY)</Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Munculkan tombol &quot;Bayar Online&quot; di detail tagihan wajib pajak pada portal pencarian warga dan peta GIS publik.
                    </p>
                  </div>
                  <Checkbox 
                    id="enable-payment" 
                    checked={enableBapendaPayment} 
                    onCheckedChange={(checked) => setEnableBapendaPayment(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>

                <div className="space-y-2 border-t border-primary/10 pt-4">
                  <Label htmlFor="payment-url" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">URL Direct Pembayaran Online (EPAY)</Label>
                  <Input
                    id="payment-url"
                    type="url"
                    placeholder="https://bapenda.go.id/pay?nop={nop}"
                    value={bapendaPaymentUrl}
                    onChange={(e) => setBapendaPaymentUrl(e.target.value)}
                    className="bg-white/50 dark:bg-[#111827]/50"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">
                    Gunakan tag <span className="text-primary font-black">{`{nop}`}</span> untuk memasukkan NOP secara otomatis ke dalam URL pembayaran daerah.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* UNIT 3: PORTAL & GIS PUBLIK */}
            <TabsContent value="publik" className="space-y-6 outline-none focus:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4 min-h-[108px] dark:bg-primary/10">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      {showNominal ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-rose-500" />}
                      Tampilkan Nominal Pajak di Publik
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Jika diaktifkan, warga dapat melihat rincian jumlah nominal rupiah tagihan PBB mereka saat mencari status pembayaran.
                    </p>
                  </div>
                  <Checkbox
                    checked={!!showNominal}
                    onCheckedChange={(checked) => setShowNominal(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>

                <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4 min-h-[108px] dark:bg-primary/10">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      <Map className={`h-4 w-4 ${enablePublicGis ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      Tampilkan GIS di Halaman Publik
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Publikasikan peta interaktif GIS pembagian zonasi wilayah desa Anda agar dapat dilihat di portal luar warga.
                    </p>
                  </div>
                  <Checkbox
                    checked={!!enablePublicGis}
                    onCheckedChange={(checked) => setEnablePublicGis(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4 min-h-[108px] dark:bg-primary/10">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      <Users className={`h-4 w-4 ${showUnpaidGis ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      Detail Tunggakan WP di GIS Publik
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Tampilkan rincian daftar wajib pajak yang belum melunasi kewajibannya saat warga mengeklik wilayah polygon di GIS publik.
                    </p>
                  </div>
                  <Checkbox
                    checked={!!showUnpaidGis}
                    onCheckedChange={(checked) => setShowUnpaidGis(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>

                <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4 min-h-[108px] dark:bg-primary/10">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      {enableArchive ? <Eye className="h-4 w-4 text-blue-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      Akses Arsip E-SPPT Publik
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Izinkan warga umum mencari, melihat, dan mengunduh berkas salinan asli dokumen digital E-SPPT PDF di portal pencarian.
                    </p>
                  </div>
                  <Checkbox
                    checked={!!enableArchive}
                    onCheckedChange={(checked) => setEnableArchive(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>

                <div className={`transition-all duration-300 ${!enableArchive ? 'opacity-50 pointer-events-none' : ''} bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4 min-h-[108px] dark:bg-primary/10`}>
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      Hanya Tampilkan E-SPPT Jika Lunas
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Warga hanya diperbolehkan mengakses E-SPPT digital jika kewajiban PBB tahun berjalan bersangkutan telah berstatus LUNAS.
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
            </TabsContent>

            {/* UNIT 4: AKSES MOBILE */}
            <TabsContent value="mobile" className="space-y-6 outline-none focus:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4 min-h-[108px] dark:bg-primary/10">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      <Smartphone className={`h-4 w-4 ${enablePbbMobile ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      Izinkan Akses PBB Mobile
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Buka otorisasi agar aplikasi PBB Mobile milik kolektor dapat login dan melakukan sinkronisasi data lapangan.
                    </p>
                  </div>
                  <Checkbox
                    checked={!!enablePbbMobile}
                    onCheckedChange={(checked) => setEnablePbbMobile(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>

                <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-2xl border p-4 min-h-[108px] dark:bg-primary/10">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2 text-sm font-bold">
                      <Bell className={`h-4 w-4 ${enablePushNotifications ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      Aktifkan Push Notifikasi HP
                    </Label>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Kirim push notifikasi pendelegasian atau perubahan real-time langsung ke tray ponsel petugas penarik (*Double-Strike*).
                    </p>
                  </div>
                  <Checkbox
                    checked={!!enablePushNotifications}
                    onCheckedChange={(checked) => setEnablePushNotifications(!!checked)}
                    className="size-5 rounded-lg border-2"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-primary/10">
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
