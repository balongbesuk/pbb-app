"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Loader2, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface AvatarUploadProps {
  initialAvatarUrl?: string | null;
  userName?: string | null;
  /** Called after a successful upload with the new URL */
  onUploadSuccess?: (newUrl: string) => void;
}

export function AvatarUpload({ initialAvatarUrl, userName, onUploadSuccess }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(initialAvatarUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { update: updateSession } = useSession();

  // Sync if prop changes (e.g. parent refetches)
  useEffect(() => {
    setCurrentAvatar(initialAvatarUrl ?? null);
  }, [initialAvatarUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
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
    formData.append("avatar", selectedFile);

    try {
      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mengupload foto.");
      } else {
        const newUrl = `${data.avatarUrl}?t=${Date.now()}`;
        toast.success("Foto profil berhasil diperbarui!");
        setCurrentAvatar(newUrl);
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onUploadSuccess?.(newUrl);
        // Force session update so topbar & other places refresh
        await updateSession();
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

  const initials = userName?.charAt(0)?.toUpperCase() || "U";
  const displaySrc = preview ?? currentAvatar;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Circle */}
      <div className="group relative">
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="ring-primary/20 relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-4 transition-all hover:ring-primary/40"
          title="Klik untuk ganti foto"
        >
          {displaySrc ? (
            <Image
              src={displaySrc}
              alt="Foto profil"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-primary text-4xl font-black">{initials}</span>
          )}

          {/* Camera overlay on hover */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 transition-all group-hover:bg-black/40">
            <Camera className="h-6 w-6 text-white opacity-0 drop-shadow-lg transition-all group-hover:opacity-100" />
            <span className="text-[10px] font-bold text-white opacity-0 transition-all group-hover:opacity-100">
              Ganti Foto
            </span>
          </div>
        </div>

        {/* Badge camera */}
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="bg-primary border-background absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-md transition-transform hover:scale-110"
          disabled={uploading}
          title="Upload foto baru"
        >
          <Camera className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        id="avatar-file-input"
      />

      {/* File info + buttons */}
      {selectedFile ? (
        <div className="w-full space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-center">
            <p className="text-sm font-semibold">{selectedFile.name}</p>
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
              {uploading ? "Mengupload..." : "Simpan Foto"}
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
        <p className="text-muted-foreground text-center text-xs">
          {currentAvatar
            ? "Klik foto untuk menggantinya"
            : "Klik untuk upload foto profil"}
          <br />
          JPG, PNG, WebP — maks. 2MB
        </p>
      )}
    </div>
  );
}
