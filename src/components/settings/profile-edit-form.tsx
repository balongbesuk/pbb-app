"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, User, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/app/actions/profile-actions";
import { useRouter } from "next/navigation";

interface ProfileEditFormProps {
  initialData: {
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
  };
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: initialData.name || "",
    email: initialData.email || "",
    phoneNumber: initialData.phoneNumber || "",
  });

  const isDirty = formData.name !== (initialData.name || "") || 
                  formData.email !== (initialData.email || "") ||
                  formData.phoneNumber !== (initialData.phoneNumber || "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (formData.name.length < 3) {
      toast.error("Nama minimal 3 karakter");
      setLoading(false);
      return;
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error("Format email tidak valid");
      setLoading(false);
      return;
    }

    if (formData.phoneNumber && (formData.phoneNumber.length < 10 || formData.phoneNumber.length > 15)) {
      toast.error("Nomor kontak harus antara 10-15 digit");
      setLoading(false);
      return;
    }

    try {
      const result = await updateUserProfile(formData);
      if (result.success) {
        toast.success("Profil berhasil diperbarui");
        router.refresh();
      } else {
        toast.error(result.message || "Gagal memperbarui profil");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2 font-bold tracking-tight">
          <User className="h-3.5 w-3.5 text-primary" />
          Nama Lengkap
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Masukkan nama lengkap..."
          disabled={loading}
          className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 shadow-sm focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2 font-bold tracking-tight">
          <Mail className="h-3.5 w-3.5 text-primary" />
          Alamat Email
        </Label>
        <Input
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Alamat email..."
          disabled={loading}
          className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 shadow-sm focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber" className="flex items-center gap-2 font-bold tracking-tight">
          <Phone className="h-3.5 w-3.5 text-primary" />
          Nomor Kontak / WhatsApp
        </Label>
        <Input
          id="phoneNumber"
          value={formData.phoneNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, "");
            setFormData(prev => ({ ...prev, phoneNumber: val }));
          }}
          placeholder="Contoh: 081234567890"
          disabled={loading}
          className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 shadow-sm focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
          type="text"
          inputMode="numeric"
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !isDirty}
        className="w-full h-11 gap-2 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {loading ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
