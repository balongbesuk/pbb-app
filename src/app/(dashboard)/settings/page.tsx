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
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <SettingsIcon className="text-primary h-8 w-8" />
            Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola konfigurasi aplikasi dan basis data Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom Kiri - Profil & Umum */}
        <div className="space-y-6 lg:col-span-2">
          <ProfileForm />

          <DusunManager />

          <RegionOtomationManager />

          <TaxConfigForm />
        </div>

        {/* Kolom Kanan - Tools & Zona Bahaya */}
        <div className="space-y-6">
          <BackupToolCard />

          <Card className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm dark:border-rose-900 dark:bg-zinc-950">
            <CardHeader className="border-b border-rose-50 px-6 pt-6 pb-5 dark:border-rose-900/10">
              <CardTitle className="flex items-center gap-3 text-lg font-bold tracking-tight text-rose-600">
                <div className="rounded-xl bg-rose-500/5 p-2">
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                </div>
                Zona Berbahaya
              </CardTitle>
              <CardDescription className="text-xs font-medium text-rose-500/70">
                Tindakan destruktif yang tidak dapat diurungkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-3">
                <p className="text-muted-foreground px-1 text-[10px] font-bold tracking-widest uppercase">
                  Integritas Data
                </p>
                <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-500/5 p-4 dark:border-rose-900/50">
                  <p className="px-1 text-[10px] leading-relaxed font-bold text-rose-700 dark:text-rose-400">
                    Menghapus seluruh daftar Wajib Pajak, riwayat pembayaran, dan alokasi penarik.
                    Gunakan hanya jika diperlukan.
                  </p>
                  <DeleteDataButton />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
