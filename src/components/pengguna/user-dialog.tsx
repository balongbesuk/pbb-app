"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Edit, Trash2, KeyRound } from "lucide-react";
import { createUser, updateUser, resetPassword, deleteUser } from "@/app/actions/user-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ROLE_BADGE, type UserRoleKey } from "@/lib/role-config";
import type { UserListItem } from "@/types/app";

export function UserDialog({
  user,
  isEdit = false,
  dusuns = [],
}: {
  user?: UserListItem;
  isEdit?: boolean;
  dusuns?: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || "PENGGUNA");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    let result;
    if (isEdit && user) {
      result = await updateUser(user.id, data);
    } else {
      result = await createUser(data);
    }

    if (result.success) {
      toast.success(isEdit ? "Berhasil memperbarui pengguna" : "Berhasil menambahkan pengguna");
      setOpen(false);
    } else {
      toast.error(`Gagal menyimpan: ${result.message}`);
    }

    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!user) return;
    setResetting(true);
    const result = await resetPassword(user.id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error("Gagal mereset password");
    }
    setResetting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit profil pengguna"
              className="hover:text-primary h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Tambah Akun
            </Button>
          )
        }
      />
      <DialogContent className="overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[480px]">
        <div className="bg-primary/5 border-primary/10 border-b p-8">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {isEdit ? "Edit Profile Pengguna" : "Tambah Akun Baru"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80 font-medium">
              {isEdit
                ? "Perbarui informasi akun di bawah ini."
                : "Set password awal otomatis: 'pbb12345'"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 p-8 pt-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-muted-foreground ml-1 text-xs font-bold tracking-wider uppercase"
              >
                Nama Lengkap
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Cth: Ach. Purnomo"
                defaultValue={user?.name || ""}
                className="focus:ring-primary/20 h-11 rounded-xl border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-muted-foreground ml-1 text-xs font-bold tracking-wider uppercase"
              >
                Username
              </Label>
              <Input
                id="username"
                name="username"
                required
                placeholder="Cth: purnomo123"
                defaultValue={user?.username || ""}
                className="focus:ring-primary/20 h-11 rounded-xl border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-muted-foreground ml-1 text-xs font-bold tracking-wider uppercase"
              >
                Role / Peran
              </Label>
              <Select
                name="role"
                defaultValue={user?.role || "PENGGUNA"}
                onValueChange={(v) => v && setSelectedRole(v)}
              >
                <SelectTrigger className="focus:ring-primary/20 h-11 w-full rounded-xl border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <SelectValue placeholder="Pilih Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENGGUNA">Pengguna (View Only)</SelectItem>
                  <SelectItem value="PENARIK">Penarik (Lapangan)</SelectItem>
                  <SelectItem value="ADMIN">Admin Super</SelectItem>
                </SelectContent>
              </Select>

              {/* ─── Live badge preview ───────────────────────────── */}
              {(() => {
                const cfg = ROLE_BADGE[(selectedRole as UserRoleKey)] ?? ROLE_BADGE.PENGGUNA;
                return (
                  <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
                        "text-[10px] font-black tracking-widest uppercase shadow-sm",
                        cfg.badge
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} aria-hidden="true" />
                      {cfg.label}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{cfg.desc}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h4 className="text-muted-foreground/60 mb-2 px-1 text-[10px] font-black tracking-[0.2em] uppercase">
              Wilayah Penugasan
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 focus-within:ring-0">
                <Label
                  htmlFor="dusun"
                  className="text-muted-foreground ml-1 text-[10px] font-bold uppercase"
                >
                  Dusun
                </Label>
                <Select name="dusun" defaultValue={user?.dusun || ""}>
                  <SelectTrigger className="h-9 w-full rounded-lg border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-950">
                    <SelectValue placeholder="Pilih Dusun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seluruh Dusun</SelectItem>
                    {dusuns.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <div className="w-full space-y-1.5">
                  <Label
                    htmlFor="rt"
                    className="text-muted-foreground ml-1 text-[10px] font-bold uppercase"
                  >
                    RT
                  </Label>
                  <Input
                    id="rt"
                    name="rt"
                    placeholder="01"
                    defaultValue={user?.rt || ""}
                    className="h-9 rounded-lg bg-white text-xs dark:bg-zinc-950"
                  />
                </div>
                <div className="w-full space-y-1.5">
                  <Label
                    htmlFor="rw"
                    className="text-muted-foreground ml-1 text-[10px] font-bold uppercase"
                  >
                    RW
                  </Label>
                  <Input
                    id="rw"
                    name="rw"
                    placeholder="01"
                    defaultValue={user?.rw || ""}
                    className="h-9 rounded-lg bg-white text-xs dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <div className="w-full sm:w-auto">
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 rounded-xl text-amber-600 hover:bg-amber-50 hover:text-amber-700 sm:w-auto dark:hover:bg-amber-950/20"
                  onClick={handleResetPassword}
                  disabled={resetting}
                >
                  {resetting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <KeyRound className="h-3 w-3" />
                  )}
                  Reset Password
                </Button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="shadow-primary/20 h-11 w-full rounded-xl px-8 font-bold shadow-lg sm:w-auto"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Simpan Perubahan" : "Simpan Akun"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteUserButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteUser(id);
    if (result.success) {
      toast.success("Berhasil menghapus pengguna");
      setOpen(false);
    } else {
      toast.error(`Gagal menghapus: ${result.message}`);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-rose-950/50">
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-3xl border-none p-8 shadow-2xl sm:max-w-[420px]">
        <DialogHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 dark:bg-rose-950/30">
            <Trash2 className="h-8 w-8" />
          </div>
          <div className="space-y-1 text-center">
            <DialogTitle className="text-xl font-bold">Konfirmasi Hapus Akun</DialogTitle>
            <DialogDescription className="text-muted-foreground/80 leading-relaxed font-medium">
              Apakah Anda yakin ingin menghapus akun ini? Aksi ini akan menghapus akses pengguna
              secara permanen dan tidak dapat dibatalkan.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="h-11 rounded-xl border-zinc-200 px-8 font-bold dark:border-zinc-800"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="h-11 rounded-xl px-8 font-bold shadow-lg shadow-rose-500/20"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Ya, Hapus Akun
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
