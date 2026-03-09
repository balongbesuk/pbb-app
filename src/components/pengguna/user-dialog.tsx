"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { UserPlus, Loader2, Edit, Trash2, KeyRound } from "lucide-react";
import { createUser, updateUser, resetPassword, deleteUser } from "@/app/actions/user-actions";
import { toast } from "sonner";

export function UserDialog({ user, isEdit = false }: { user?: any, isEdit?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

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
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Tambah Akun
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Pengguna" : "Tambah Akun Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Ubah data akun form di bawah ini." : "Set password awal akan menggunakan 'pbb12345'"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" name="name" required placeholder="Cth: Ach. Purnomo" defaultValue={user?.name || ""} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required placeholder="Cth: purnomo123" defaultValue={user?.username || ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role / Peran</Label>
            <select 
              id="role" 
              name="role" 
              defaultValue={user?.role || "PENGGUNA"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="PENGGUNA">Pengguna (View Only)</option>
              <option value="PENARIK">Penarik (Lapangan)</option>
              <option value="ADMIN">Admin Super</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="dusun">Dusun Area</Label>
              <Input id="dusun" name="dusun" placeholder="Area Tugas" defaultValue={user?.dusun || ""} />
            </div>
            <div className="flex gap-2">
              <div className="space-y-2 w-full">
                <Label htmlFor="rt">RT</Label>
                <Input id="rt" name="rt" placeholder="00" defaultValue={user?.rt || ""} />
              </div>
              <div className="space-y-2 w-full">
                <Label htmlFor="rw">RW</Label>
                <Input id="rw" name="rw" placeholder="00" defaultValue={user?.rw || ""} />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between gap-3 border-t border-border mt-4">
            <div className="w-full sm:w-auto">
               {isEdit && (
                 <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto gap-2 text-amber-600 hover:text-amber-700"
                    onClick={handleResetPassword}
                    disabled={resetting}
                 >
                   {resetting ? <Loader2 className="w-3 h-3 animate-spin"/> : <KeyRound className="w-3 h-3" />}
                   Reset Password
                 </Button>
               )}
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
      <DialogTrigger
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
      >
        <Trash2 className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Konfirmasi Penghapusan
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus akun pengguna ini? Semua data terkait (seperti pembagian tugas) mungkin akan terpengaruh. Aksi ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Ya, Hapus Akun
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
