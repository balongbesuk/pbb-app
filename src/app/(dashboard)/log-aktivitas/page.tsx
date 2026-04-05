import { getAuditLogs } from "@/app/actions/log-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  UserCircle,
  Activity,
  Box,
  Calendar,
  ShieldCheck,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  LogIn,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { LogFilters } from "@/components/log/log-filters";
import { LogTablePagination } from "@/components/log/log-table-pagination";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
function getActionLabel(action: string, details?: string | null) {
  const acts: Record<string, { label: string; color: string; icon: React.ReactNode; classes: string }> = {
    UPLOAD_TAX: {
      label: "Upload Data",
      color: "sky",
      icon: <FileText className="h-3.5 w-3.5" />,
      classes:
        "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    },
    CLEAR_TAX: {
      label: "Kosongkan Data",
      color: "rose",
      icon: <Activity className="h-3.5 w-3.5" />,
      classes:
        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    },
    ASSIGN_TAX: {
      label: "Tugaskan PBB",
      color: "indigo",
      icon: <UserCircle className="h-3.5 w-3.5" />,
      classes:
        "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    },
    UPDATE_REGION: {
      label: "Ubah Wilayah",
      color: "amber",
      icon: <Box className="h-3.5 w-3.5" />,
      classes:
        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    RESTORE_TAX: {
      label: "Restore Data",
      color: "purple",
      icon: <History className="h-3.5 w-3.5" />,
      classes:
        "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
    TRANSFER_REQUEST: {
      label: "Minta Pindah",
      color: "cyan",
      icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
      classes:
        "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    },
    LOGIN: {
      label: "Login Sistem",
      color: "blue",
      icon: <LogIn className="h-3.5 w-3.5" />,
      classes:
        "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
    CREATE_USER: {
      label: "Tambah User",
      color: "emerald",
      icon: <UserCircle className="h-3.5 w-3.5" />,
      classes:
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    UPDATE_USER: {
      label: "Ubah User",
      color: "amber",
      icon: <UserCircle className="h-3.5 w-3.5" />,
      classes:
        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    DELETE_USER: {
      label: "Hapus User",
      color: "rose",
      icon: <UserCircle className="h-3.5 w-3.5" />,
      classes:
        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    },
    UPDATE_PROFILE: {
      label: "Perbarui Profil",
      color: "indigo",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      classes:
        "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    },
    UPDATE_AVATAR: {
      label: "Foto Profil",
      color: "teal",
      icon: <UserCircle className="h-3.5 w-3.5" />,
      classes:
        "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    },
  };

  if (action === "UPDATE_PAYMENT") {
    const isLunas = details?.includes("LUNAS") && !details?.includes("BELUM_LUNAS");
    const isUnpaid = details?.includes("BELUM_LUNAS");
    return {
      label: isLunas ? "Setoran Lunas" : isUnpaid ? "Belum Lunas" : "Update Status",
      color: isLunas ? "emerald" : isUnpaid ? "rose" : "slate",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      classes: isLunas
        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
        : isUnpaid
          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    };
  }

  if (action === "TRANSFER_RESPONSE") {
    const detailUpper = details?.toUpperCase() || "";
    const isAccepted = detailUpper.includes("MENYETUJUI") || detailUpper.includes("ACCEPTED");
    const isRejected = detailUpper.includes("MENOLAK") || detailUpper.includes("REJECTED");
    return {
      label: isAccepted ? "Pindah Disetujui" : isRejected ? "Pindah Ditolak" : "Respon Pindah",
      color: isAccepted ? "emerald" : isRejected ? "orange" : "slate",
      icon: isAccepted ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      ),
      classes: isAccepted
        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
        : isRejected
          ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    };
  }

  return (
    acts[action] || {
      label: action,
      color: "slate",
      icon: <Activity className="h-3.5 w-3.5" />,
      classes:
        "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    }
  );
}

function getEntityLabel(entity: string) {
  switch (entity) {
    case "TaxData":
    case "TaxMapping":
      return "Data Pajak (PBB)";
    case "User":
    case "USER":
      return "Pengguna";
    case "DusunReference":
      return "Referensi Dusun";
    case "VillageConfig":
      return "Pengaturan Desa";
    default:
      return entity;
  }
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string; 
    page?: string;
    action?: string;
    user?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const filterAction = params.action || "all";
  const filterUser = params.user || "all";
  const startDate = params.start || "";
  const endDate = params.end || "";
  const limit = 50;

  const { logs, total } = await getAuditLogs(
    limit, 
    page, 
    query, 
    filterAction, 
    filterUser, 
    startDate, 
    endDate
  );
  
  const totalPages = Math.ceil(total / limit);

  const users = await prisma.user.findMany({
    select: { id: true, name: true }
  });

  const actions = [
    { value: "UPLOAD_TAX", label: "Upload Data" },
    { value: "CLEAR_TAX", label: "Kosongkan Data" },
    { value: "UPDATE_PAYMENT", label: "Update Status PBB" },
    { value: "ASSIGN_TAX", label: "Tugaskan PBB" },
    { value: "UPDATE_REGION", label: "Ubah Wilayah" },
    { value: "RESTORE_TAX", label: "Restore Data" },
    { value: "TRANSFER_REQUEST", label: "Mutasi WP" },
    { value: "LOGIN", label: "Login Sistem" },
    { value: "CREATE_USER", label: "Tambah User" },
    { value: "UPDATE_USER", label: "Ubah User" },
    { value: "DELETE_USER", label: "Hapus User" },
    { value: "UPDATE_PROFILE", label: "Update Profil" },
  ];

  const hasFilters = query || filterAction !== "all" || filterUser !== "all" || startDate || endDate;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Activity className="text-primary h-8 w-8" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground mt-1">
            Rekam jejak seluruh aktivitas penting dan modifikasi data dalam sistem
          </p>
        </div>
        
        <LogFilters users={users} actions={actions} />
      </div>

      <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-50 px-6 pt-6 pb-5 dark:border-zinc-900/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Riwayat Aktivitas</CardTitle>
              <CardDescription>
                {hasFilters ? `Menampilkan hasil filter aktif` : "Menampilkan aktivitas terbaru sistem"}
              </CardDescription>
            </div>
            <div className="bg-primary/10 text-primary rounded-full px-4 py-1 text-xs font-black uppercase tracking-tight">
              {total.toLocaleString()} Records
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-border/50 max-h-[70vh] divide-y overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-muted-foreground p-12 text-center text-sm italic">
                Belum ada riwayat aktivitas tercatat.
              </div>
            ) : (
              logs.map((log) => {
                const badgeInfo = getActionLabel(log.action, log.details);
                return (
                  <div
                    key={log.id}
                    className="group flex gap-4 p-5 transition-all hover:bg-zinc-50/50 md:px-6 dark:hover:bg-zinc-900/30"
                  >
                    <div className="mt-1 hidden shrink-0 sm:block">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl border transition-all",
                          badgeInfo.classes,
                          "bg-opacity-10 dark:bg-opacity-20"
                        )}
                      >
                        {badgeInfo.icon}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all",
                              badgeInfo.classes
                            )}
                          >
                            {badgeInfo.label}
                          </Badge>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                            {log.user ? log.user.name : "Sistem Otomatis"}
                          </span>
                        </div>
                        <span className="text-muted-foreground/60 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.createdAt), "dd MMM yyyy • HH:mm", { locale: id })}
                        </span>
                      </div>

                      <p className="text-foreground/80 text-sm leading-relaxed font-medium">
                        {log.action === "LOGIN" ? (
                          <>
                            Akses masuk ke sistem pada{" "}
                            <span className="text-foreground font-black">
                              {getEntityLabel(log.entity)}
                            </span>
                          </>
                        ) : log.action === "UPDATE_PROFILE" || log.action === "UPDATE_AVATAR" ? (
                          <>
                            Berhasil memperbarui profil akun{" "}
                            <span className="text-primary font-black">
                              {log.entityId ? `(ID: ${log.entityId})` : "sendiri"}
                            </span>
                          </>
                        ) : log.entity === "User" || log.entity === "USER" ? (
                          <>
                            Manajemen pengguna pada{" "}
                            <span className="text-foreground font-black">
                              {getEntityLabel(log.entity)}
                            </span>
                          </>
                        ) : log.entityId ? (
                          <>
                            Perubahan pada{" "}
                            <span className="text-foreground font-black">
                              {getEntityLabel(log.entity)}
                            </span>
                            <span>
                              {log.entity === "TaxData" || log.entity === "TaxMapping"
                                ? " untuk WP: "
                                : " ID: "}
                              <code className="bg-primary/5 text-primary border-primary/10 rounded-md border px-1.5 py-0.5 text-[10px] font-black tracking-tight">
                                {log.entityId}
                              </code>
                            </span>
                          </>
                        ) : (
                          <>
                            Proses sistem pada{" "}
                            <span className="text-foreground font-black">
                              {getEntityLabel(log.entity)}
                            </span>
                          </>
                        )}
                      </p>

                      {log.details && (
                        <div className="text-muted-foreground/80 overflow-x-auto rounded-xl border border-zinc-100 bg-zinc-50 p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap dark:border-zinc-800/50 dark:bg-zinc-900/50">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <LogTablePagination totalPages={totalPages} currentPage={page} total={total} />
        </CardContent>
      </Card>
    </div>
  );
}
