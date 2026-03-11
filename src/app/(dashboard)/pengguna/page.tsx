import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { UserDialog, DeleteUserButton } from "@/components/pengguna/user-dialog";
import { cn } from "@/lib/utils";
import { ROLE_BADGE, type UserRoleKey } from "@/lib/role-config";

export default async function DaftarPenggunaPage() {
  const users = await prisma.user.findMany({
    orderBy: { role: "asc" },
    include: {
      _count: {
        select: { taxData: { where: { tahun: new Date().getFullYear() } } },
      },
    },
  });

  const dusuns = await prisma.dusunReference.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground">Kelola akun Admin, Pengguna, dan tim Penarik PBB</p>
        </div>
        <UserDialog dusuns={dusuns} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {users.map((user: any) => (
          <Card
            key={user.id}
            className="hover:border-primary/20 group flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 dark:border-zinc-900 dark:bg-zinc-950"
          >
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="text-primary group-hover:bg-primary relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 text-xl font-black transition-colors duration-500 group-hover:text-white dark:border-zinc-800 dark:bg-zinc-900">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.name?.charAt(0)
                  )}
                </div>
                {/* ─── Role Badge ───────────────────────────── */}
                {(() => {
                  const cfg = ROLE_BADGE[(user.role as UserRoleKey)] ?? ROLE_BADGE.PENGGUNA;
                  return (
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1",
                        "text-[10px] font-black tracking-widest uppercase",
                        "shadow-sm transition-all duration-200",
                        cfg.badge
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)}
                        aria-hidden="true"
                      />
                      {cfg.label}
                    </Badge>
                  );
                })()}
              </div>
              <div className="mt-4 space-y-1">
                <CardTitle className="text-foreground text-lg font-bold tracking-tight">
                  {user.name}
                </CardTitle>
                <p className="text-muted-foreground text-xs font-medium lowercase">
                  @{user.username}
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-5 px-6 pb-6">
              <div className="space-y-3 pt-2">
                <div className="text-muted-foreground flex items-center gap-2.5 text-xs font-medium">
                  <div className="rounded-lg bg-zinc-50 p-1.5 dark:bg-zinc-900">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <span>
                    {user.dusun || "Seluruh Area"} • RT {user.rt || "Semua"}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-5 dark:border-zinc-900">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground/60 text-xs font-bold tracking-wider uppercase">
                    Pajak Aktif
                  </p>
                  <p className="text-foreground text-lg font-black tracking-tighter">
                    {user._count.taxData.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <UserDialog user={user} isEdit={true} dusuns={dusuns} />
                  {user.role !== "ADMIN" && <DeleteUserButton id={user.id} />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
