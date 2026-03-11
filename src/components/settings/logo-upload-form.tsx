"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, Upload, Loader2, Trash2, ImageIcon } from "lucide-react";
import { getVillageConfig } from "@/app/actions/settings-actions";

export function LogoUploadForm() {
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadConfig() {
      const config = await getVillageConfig();
      if (config.logoUrl) {
        setCurrentLogo(config.logoUrl + "?t=" + Date.now());
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      toast.error("Format tidak didukung. Gunakan JPG, PNG, WebP, atau SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("logo", selectedFile);

    try {
      const res = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mengupload logo.");
      } else {
        toast.success("Logo desa berhasil diperbarui!");
        setCurrentLogo(data.logoUrl + "?t=" + Date.now());
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="glass border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="text-primary h-5 w-5" />
          Logo Desa
        </CardTitle>
        <CardDescription>
          Upload logo atau lambang desa yang akan ditampilkan pada laporan dan aplikasi.
          Maksimal 2MB (JPG, PNG, WebP, SVG).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Logo Preview Area */}
            <div
              className="group relative flex h-36 w-36 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-white/40 transition-all hover:border-primary/70 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/30"
              onClick={() => fileInputRef.current?.click()}
              title="Klik untuk memilih gambar"
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Preview logo baru"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : currentLogo ? (
                <Image
                  src={currentLogo}
                  alt="Logo desa saat ini"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <ImageIcon className="text-muted-foreground h-10 w-10" />
                  <span className="text-muted-foreground text-xs">Belum ada logo</span>
                </div>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                <Upload className="h-6 w-6 text-white opacity-0 transition-all group-hover:opacity-100" />
              </div>
            </div>

            {/* File input & Buttons */}
            <div className="flex flex-1 flex-col gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
                id="logo-file-input"
              />

              {!preview ? (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Pilih File Logo
                  </Button>
                  {currentLogo && (
                    <p className="text-muted-foreground text-xs">
                      ✓ Logo tersimpan. Klik gambar atau tombol di atas untuk mengganti.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-sm font-medium">File dipilih:</p>
                    <p className="text-muted-foreground text-xs">{selectedFile?.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {selectedFile ? (selectedFile.size / 1024).toFixed(1) + " KB" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="gap-2"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading ? "Mengupload..." : "Upload Logo"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={handleCancelPreview}
                      disabled={uploading}
                    >
                      <Trash2 className="h-4 w-4" />
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
