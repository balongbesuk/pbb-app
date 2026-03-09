import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { UserDialog, DeleteUserButton } from "@/components/pengguna/user-dialog";

export default async function DaftarPenggunaPage() {
  const users = await prisma.user.findMany({
    orderBy: { role: 'asc' },
    include: {
      _count: {
        select: { taxData: { where: { tahun: new Date().getFullYear() } } }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground">Kelola akun Admin, Pengguna, dan tim Penarik PBB</p>
        </div>
        <UserDialog />
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {users.map((user: any) => (
          <Card key={user.id} className="glass border-none shadow-xl overflow-hidden hover:scale-[1.02] transition-transform flex flex-col">
            <div className={`h-2 ${user.role === 'ADMIN' ? 'bg-rose-500' : user.role === 'PENARIK' ? 'bg-amber-500' : 'bg-primary'}`} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {user.name?.charAt(0)}
                </div>
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'default'} className="flex items-center gap-1">
                  {user.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3"/> : null}
                  {user.role}
                </Badge>
              </div>
              <CardTitle className="mt-4">{user.name}</CardTitle>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{user.dusun || "Seluruh Area"}, RT {user.rt || "Semua"}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pajak Ditugaskan</p>
                  <p className="text-lg font-bold">{user._count.taxData}</p>
                </div>
                <div className="flex gap-1">
                  <UserDialog user={user} isEdit={true} />
                  {user.role !== 'ADMIN' && <DeleteUserButton id={user.id} />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
