"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { PenTool, Loader2, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignatureUploadProps {
  initialSignatureUrl?: string | null;
  /** Called after a successful upload with the new URL */
  onUploadSuccess?: (newUrl: string) => void;
}

export function SignatureUpload({ initialSignatureUrl, onUploadSuccess }: SignatureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | null>(initialSignatureUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentSignature(initialSignatureUrl ?? null);
  }, [initialSignatureUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Format tidak didukung. Gunakan JPG, PNG, atau WebP transparan.");
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
    formData.append("signature", selectedFile);

    try {
      const res = await fetch("/api/upload-signature", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mengupload tanda tangan.");
      } else {
        const newUrl = `${data.signatureUrl}?t=${Date.now()}`;
        toast.success("Tanda tangan berhasil diperbarui!");
        setCurrentSignature(newUrl);
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onUploadSuccess?.(newUrl);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displaySrc = preview ?? currentSignature;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="group relative w-full max-w-[200px]">
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="ring-primary/20 relative flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary/5 ring-2 border border-dashed border-primary/30 transition-all hover:bg-primary/10"
          title="Klik untuk upload tanda tangan"
        >
          {displaySrc ? (
            <Image
              src={displaySrc}
              alt="Tanda tangan"
              fill
              className="object-contain p-2"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <PenTool className="mb-2 h-6 w-6 opacity-50" />
              <span className="text-xs font-medium">Upload Tanda Tangan</span>
            </div>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 transition-all group-hover:bg-black/10">
            <span className="text-[10px] font-bold text-white opacity-0 transition-all group-hover:opacity-100 drop-shadow-md">
              Ganti Gambar
            </span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        id="signature-file-input"
      />

      {selectedFile ? (
        <div className="w-full space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-center">
            <p className="text-sm font-semibold truncate">{selectedFile.name}</p>
            <p className="text-muted-foreground text-xs">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Mengupload..." : "Simpan TTD"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleCancel}
              disabled={uploading}
            >
              <Trash2 className="h-4 w-4" />
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-center text-[11px] leading-tight max-w-[250px] space-y-2">
          <p>
            {currentSignature
              ? "Gambar tanda tangan ini otomatis disematkan pada Kwitansi cetak maupun digital."
              : "Upload tanda tangan untuk disematkan di Kwitansi cetak maupun digital."}
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg border border-emerald-100 dark:border-emerald-500/20 text-[10px] font-medium text-left">
            <span className="font-bold block mb-1">💡 Tips agar pas di Kwitansi:</span>
            <ul className="list-disc pl-3 space-y-0.5">
              <li>Gunakan format <b>PNG transparan</b></li>
              <li>Pastikan gambar sudah di-<b>crop</b> rapat (tanpa area kosong/putih terlalu lebar)</li>
              <li>Rasio ideal <b>1:1</b> atau memanjang <b>2:1</b></li>
              <li>Ukuran file maksimal <b>2MB</b></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
