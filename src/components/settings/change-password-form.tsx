"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { changeOwnPassword } from "@/app/actions/profile-actions";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const oldPass = formData.get("oldPassword") as string;
    const newPass = formData.get("newPassword") as string;
    const confirmPass = formData.get("confirmPassword") as string;

    if (newPass !== confirmPass) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      setLoading(false);
      return;
    }

    if (newPass.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      setLoading(false);
      return;
    }

    const result = await changeOwnPassword(oldPass, newPass);
    if (result.success) {
      toast.success("Berhasil mengubah password");
      (e.target as HTMLFormElement).reset();
    } else {
      toast.error(`Gagal mengubah password: ${result.message}`);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="oldPassword">Password Lama</Label>
        <div className="relative">
          <Input
            id="oldPassword"
            name="oldPassword"
            type={showOldPass ? "text" : "password"}
            required
            className="bg-white/50 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowOldPass(!showOldPass)}
            className="text-muted-foreground hover:text-foreground absolute top-2.5 right-3 focus:outline-none"
          >
            {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Password Baru</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showNewPass ? "text" : "password"}
            required
            className="bg-white/50 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPass(!showNewPass)}
            className="text-muted-foreground hover:text-foreground absolute top-2.5 right-3 focus:outline-none"
          >
            {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPass ? "text" : "password"}
            required
            className="bg-white/50 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            className="text-muted-foreground hover:text-foreground absolute top-2.5 right-3 focus:outline-none"
          >
            {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full gap-2 md:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Ubah Password
        </Button>
      </div>
    </form>
  );
}
