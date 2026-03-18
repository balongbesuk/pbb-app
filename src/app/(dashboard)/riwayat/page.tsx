import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, CheckCircle2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function RiwayatPekerjaanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;

  if (!currentUser || currentUser.role !== "PENARIK") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 50;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { 
        userId: currentUser.id,
        action: "UPDATE_PAYMENT"
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.auditLog.count({
      where: { 
        userId: currentUser.id,
        action: "UPDATE_PAYMENT"
      }
    })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-in fade-in space-y-6 duration-700 mx-auto max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-primary flex items-center gap-3 text-3xl font-extrabold tracking-tight">
          <History className="h-8 w-8" />
          Riwayat Penagihan Saya
        </h1>
        <p className="text-muted-foreground font-medium">
          Daftar seluruh aktivitas penagihan dan pembaruan status PBB yang pernah Anda lakukan.
        </p>
      </div>

      <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-50 px-6 pt-6 pb-5 dark:border-zinc-900/50">
          <div className="flex items-center justify-between">
             <CardTitle className="text-xl font-bold tracking-tight">Semua Riwayat</CardTitle>
             <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-black tracking-widest">
               TOTAL: {total} DATA
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-border/50 max-h-[70vh] divide-y overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-sm font-medium text-muted-foreground">
                Belum ada riwayat penagihan yang tercatat.
              </div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="group flex gap-4 p-5 transition-all hover:bg-zinc-50/50 md:px-6 dark:hover:bg-zinc-900/30">
                  <div className="mt-1 hidden shrink-0 sm:block">
                    <div className="bg-emerald-500/10 border-emerald-500/20 flex h-10 w-10 items-center justify-center rounded-xl border">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="font-bold text-foreground">{log.details}</p>
                      <span className="text-muted-foreground/60 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.createdAt), "dd MMM yyyy • HH:mm", { locale: id })}
                      </span>
                    </div>
                    {log.entityId && (
                      <p className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md w-fit">
                        ID WP: <span className="font-mono font-bold">{log.entityId}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="border-border/50 flex items-center justify-center border-t bg-muted/10 p-4">
              <div className="flex gap-2 text-sm font-bold">
                {page > 1 ? (
                  <a href={`/riwayat?page=${page - 1}`} className="hover:text-primary text-muted-foreground transition-colors">« Sebelumnya</a>
                ) : (
                  <span className="text-muted-foreground/30">« Sebelumnya</span>
                )}
                <span className="text-foreground px-4">Hal {page} dari {totalPages}</span>
                {page < totalPages ? (
                  <a href={`/riwayat?page=${page + 1}`} className="hover:text-primary text-muted-foreground transition-colors">Selanjutnya »</a>
                ) : (
                  <span className="text-muted-foreground/30">Selanjutnya »</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
