"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Edit2, Check, X, User, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateUserProfile } from "@/app/actions/profile-actions";
import { useRouter } from "next/navigation";

type EditableProfileData = {
  name: string;
  email: string;
  phoneNumber: string;
};

const ICONS = {
  user: User,
  mail: Mail,
  phone: Phone,
  map: MapPin,
};

interface EditableProfileRowProps {
  label: string;
  value: string | null;
  fieldName: "name" | "email" | "phoneNumber";
  iconName?: keyof typeof ICONS;
  userData: {
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
  };
}

export function EditableProfileRow({
  label,
  value,
  fieldName,
  iconName,
  userData,
}: EditableProfileRowProps) {
  const Icon = iconName ? ICONS[iconName] : null;
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (currentValue === (value || "")) {
      setIsEditing(false);
      return;
    }

    // Validasi Email
    if (fieldName === "email" && currentValue) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(currentValue)) {
        toast.error("Format alamat email tidak valid");
        return;
      }
    }

    // Validasi Nomor HP (opsional tapi bagus)
    if (fieldName === "phoneNumber" && currentValue) {
      if (currentValue.length < 10 || currentValue.length > 15) {
        toast.error("Nomor kontak harus antara 10-15 digit");
        return;
      }
    }

    setLoading(true);
    try {
      // Menyiapkan data lengkap untuk update (Prisma butuh data lengkap di action kita tadi)
      const updateData: EditableProfileData = {
        name: userData.name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
      };
      updateData[fieldName] = currentValue;

      const result = await updateUserProfile(updateData);
      if (result.success) {
        toast.success(`${label} berhasil diperbarui`);
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.message || "Gagal memperbarui");
      }
    } catch {
      toast.error("Kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group flex items-center justify-between py-3 transition-all">
      <div className="flex-1 space-y-1">
        <span className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
          {Icon && <Icon className="h-3 w-3 text-primary/60" />}
          {label}
        </span>
        
        {isEditing ? (
          <div className="mt-1 flex max-w-md items-center gap-2">
            <Input
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="h-9 rounded-lg border-primary/20 bg-white shadow-sm focus-visible:ring-primary"
              autoFocus
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        ) : (
          <p className="text-foreground text-sm font-bold tracking-tight">
            {value || <span className="text-zinc-400 italic font-normal">Belum diatur</span>}
          </p>
        )}
      </div>

      <div className="ml-4 flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              size="icon"
              variant="default"
              className="h-8 w-8 rounded-full shadow-lg"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              onClick={() => {
                setIsEditing(false);
                setCurrentValue(value || "");
              }}
              disabled={loading}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-2 rounded-full px-3 text-zinc-400 opacity-0 transition-opacity hover:bg-primary/5 hover:text-primary group-hover:opacity-100"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-3 w-3" />
            <span className="text-xs font-bold">Edit</span>
          </Button>
        )}
      </div>
    </div>
  );
}
