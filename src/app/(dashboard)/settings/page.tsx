import { Settings as SettingsIcon, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteDataButton } from "@/components/settings/delete-data-button";
import { DusunManager } from "@/components/settings/dusun-manager";
import { RegionOtomationManager } from "@/components/settings/region-otomation-manager";
import { ProfileForm } from "@/components/settings/profile-form";
import { TaxConfigForm } from "@/components/settings/tax-config-form";
import { BackupToolCard } from "@/components/settings/backup-tool-card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground mt-1">Kelola konfigurasi aplikasi dan basis data Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri - Profil & Umum */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileForm />

          <DusunManager />

          <RegionOtomationManager />

          <TaxConfigForm />
        </div>

        {/* Kolom Kanan - Tools & Zona Bahaya */}
        <div className="space-y-6">
          <BackupToolCard />

          <Card className="border-rose-200 dark:border-rose-900/50 shadow-lg bg-rose-50/50 dark:bg-rose-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                Zona Berbahaya
              </CardTitle>
              <CardDescription className="text-rose-600/80 dark:text-rose-400/70">
                Tindakan di bawah ini bersifat destruktif dan tidak dapat diurungkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Hapus Semua Data Pajak</h3>
                <p className="text-xs text-muted-foreground">
                  Menghapus seluruh daftar Wajib Pajak, riwayat pembayaran, dan alokasi penarik. Cocok digunakan saat akan memulai tahun baru atau terjadi kesalahan import massal.
                </p>
                <DeleteDataButton />
              </div>
              
              <div className="hidden space-y-2 border-t border-rose-200/50 pt-4">
                <h3 className="font-semibold text-sm">Reset Akun Penarik</h3>
                <p className="text-xs text-muted-foreground">
                  Menghapus semua akun petugas penarik pajak.
                </p>
                <Button variant="outline" className="w-full mt-2 border-rose-300 text-rose-700 hover:bg-rose-100">
                  Reset Akun Petugas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
