"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { createManualTaxData, fetchBapendaData } from "@/app/actions/tax-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaymentStatus } from "@prisma/client";

export function TaxAddManualDialog({
  dusunList = [],
  rwList = [],
  rtList = [],
}: {
  dusunList?: string[];
  rwList?: string[];
  rtList?: string[];
}) {
  const paymentStatusOptions: PaymentStatus[] = ["BELUM_LUNAS", "LUNAS", "SUSPEND", "TIDAK_TERBIT"];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [nop, setNop] = useState("");
  const [namaWp, setNamaWp] = useState("");
  const [alamatObjek, setAlamatObjek] = useState("");
  const [luasTanah, setLuasTanah] = useState("");
  const [luasBangunan, setLuasBangunan] = useState("");
  const [ketetapan, setKetetapan] = useState("");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("BELUM_LUNAS");
  const [dusun, setDusun] = useState<string>("");
  const [rw, setRw] = useState<string>("");
  const [rt, setRt] = useState<string>("");

  const [checkingBapenda, setCheckingBapenda] = useState(false);

  const resetForm = () => {
    setNop("");
    setNamaWp("");
    setAlamatObjek("");
    setLuasTanah("");
    setLuasBangunan("");
    setKetetapan("");
    setDusun("");
    setRw("");
    setRt("");
    setTahun(new Date().getFullYear().toString());
    setPaymentStatus("BELUM_LUNAS");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    setOpen(newOpen);
  };

  const handleCheckBapenda = async () => {
    if (!nop || nop.replace(/\D/g, "").length !== 18) {
      toast.error("Masukkan 18 digit angka NOP terlebih dahulu.");
      return;
    }

    setCheckingBapenda(true);
    toast.info("Mengambil data dari Bapenda...");
    try {
      const res = await fetchBapendaData(nop, Number(tahun) || new Date().getFullYear());
      if (res.success && res.data) {
        toast.success("Berhasil sinkronisasi data dari Bapenda!");
        if (res.data.namaWp) setNamaWp(res.data.namaWp);
        if (res.data.alamatObjek) setAlamatObjek(res.data.alamatObjek);
        if (res.data.luasTanah) setLuasTanah(res.data.luasTanah.replace(/\D/g,""));
        if (res.data.luasBangunan) setLuasBangunan(res.data.luasBangunan.replace(/\D/g,""));
        if (res.data.ketetapan) setKetetapan(res.data.ketetapan.toString());
      } else {
        toast.error(res.message || "Gagal sinkron data Bapenda.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghubungi Bapenda.");
    } finally {
      setCheckingBapenda(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nop || !namaWp || !alamatObjek || !ketetapan) {
      toast.error("NOP, Nama WP, Alamat Objek, dan Nominal Pajak PBB wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await createManualTaxData({
        nop,
        namaWp,
        alamatObjek,
        luasTanah: Number(luasTanah) || 0,
        luasBangunan: Number(luasBangunan) || 0,
        ketetapan: Number(ketetapan) || 0,
        tahun: Number(tahun) || new Date().getFullYear(),
        paymentStatus,
        dusun: dusun || undefined,
        rw: rw || undefined,
        rt: rt || undefined
      });

      if (res.success) {
        toast.success("Berhasil menambahkan data pajak manual.");
        handleOpenChange(false);
      } else {
        toast.error(res.message || "Gagal menyimpan data pajak.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="default" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Data Pajak Manual
      </Button>
      <DialogContent className="w-[95vw] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Tambah Data Pajak Manual</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-2">
              <Label>NOP <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Contoh: 35.17.150.0... dsb"
                  value={nop}
                  onChange={(e) => setNop(e.target.value)}
                  maxLength={30}
                  required
                />
                <Button 
                  type="button" 
                  variant="outline"
                  title="Sinkronisasi Bapenda Jombang"
                  disabled={checkingBapenda || !nop}
                  onClick={handleCheckBapenda}
                >
                  {checkingBapenda ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Wajib Pajak <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Nama pemilik pajak"
                value={namaWp}
                onChange={(e) => setNamaWp(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Alamat Objek Pajak <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Alamat lengkap properti/objek"
                value={alamatObjek}
                onChange={(e) => setAlamatObjek(e.target.value)}
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Luas Tanah (M²)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={luasTanah}
                onInput={(e) => (e.currentTarget.value = e.currentTarget.value.slice(0, 10))}
                onChange={(e) => setLuasTanah(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Luas Bangunan (M²)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={luasBangunan}
                onInput={(e) => (e.currentTarget.value = e.currentTarget.value.slice(0, 10))}
                onChange={(e) => setLuasBangunan(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nominal Pajak PBB (Rp) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min="0"
                placeholder="Ketetapan/Pokok pajak"
                value={ketetapan}
                onInput={(e) => (e.currentTarget.value = e.currentTarget.value.slice(0, 12))}
                onChange={(e) => setKetetapan(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tahun Pajak <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min="2000"
                value={tahun}
                onInput={(e) => (e.currentTarget.value = e.currentTarget.value.slice(0, 4))}
                onChange={(e) => setTahun(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status Awal <span className="text-red-500">*</span></Label>
              <Select
                value={paymentStatus}
                onValueChange={(val) => {
                  if (paymentStatusOptions.includes(val as PaymentStatus)) {
                    setPaymentStatus(val as PaymentStatus);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BELUM_LUNAS" className="font-bold text-amber-600">⏳ Belum Lunas</SelectItem>
                  <SelectItem value="LUNAS" className="font-bold text-emerald-600">✅ Lunas</SelectItem>
                  <SelectItem value="SUSPEND" className="font-bold text-orange-600">🚫 Sengketa</SelectItem>
                  <SelectItem value="TIDAK_TERBIT" className="font-bold text-stone-600">📄 Tidak Terbit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-6 pb-2 border-t mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            <div className="space-y-2">
              <Label>Dusun (Opsional)</Label>
              <Select value={dusun || "kosong"} onValueChange={(val) => setDusun(val === "kosong" || !val ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Dusun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kosong" className="text-muted-foreground italic">-- Kosongkan --</SelectItem>
                  {dusunList.map((d, i) => (
                    <SelectItem key={i} value={d.toUpperCase()}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RW (Opsional)</Label>
              <Select value={rw || "kosong"} onValueChange={(val) => setRw(val === "kosong" || !val ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih RW" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kosong" className="text-muted-foreground italic">-- Kosongkan --</SelectItem>
                  {rwList.map((r, i) => (
                    <SelectItem key={i} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RT (Opsional)</Label>
              <Select value={rt || "kosong"} onValueChange={(val) => setRt(val === "kosong" || !val ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih RT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kosong" className="text-muted-foreground italic">-- Kosongkan --</SelectItem>
                  {rtList.map((r, i) => (
                    <SelectItem key={i} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Menyimpan..." : "Simpan Data Pajak"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
