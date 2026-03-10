import { getAuditLogs } from "@/app/actions/log-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, UserCircle, Activity, Box, Search, Calendar, ShieldCheck, ArrowRightLeft, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { LogSearch } from "@/components/log/log-search";
import { LogPagination } from "@/components/log/log-pagination";

function getActionLabel(action: string, details?: string | null) {
  switch (action) {
    case "UPLOAD_TAX": return { label: "Upload Data", color: "bg-blue-600", icon: <FileText className="w-3 h-3" /> };
    case "CLEAR_TAX": return { label: "Hapus Data Tahunan", color: "bg-red-600", icon: <Activity className="w-3 h-3" /> };
    case "UPDATE_PAYMENT": {
      const isLunas = details?.includes("LUNAS") && !details?.includes("BELUM_LUNAS");
      const isUnpaid = details?.includes("BELUM_LUNAS");

      return {
        label: isLunas ? "Tandai Lunas" : isUnpaid ? "Tandai Belum Lunas" : "Ubah Status",
        color: isLunas ? "bg-emerald-600" : isUnpaid ? "bg-rose-500" : "bg-slate-600",
        icon: <ShieldCheck className="w-3 h-3" />
      };
    }
    case "ASSIGN_TAX": return { label: "Tugaskan PBB", color: "bg-indigo-600", icon: <UserCircle className="w-3 h-3" /> };
    case "UPDATE_REGION": return { label: "Ubah Wilayah RT/RW", color: "bg-amber-600", icon: <Box className="w-3 h-3" /> };
    case "RESTORE_TAX": return { label: "Restore Data", color: "bg-purple-600", icon: <FileText className="w-3 h-3" /> };
    case "TRANSFER_REQUEST": return { label: "Permintaan Pindah", color: "bg-sky-600", icon: <ArrowRightLeft className="w-3 h-3" /> };
    case "TRANSFER_RESPONSE": {
      const isAccepted = details?.includes("Menyetujui");
      return {
        label: isAccepted ? "Permintaan Disetujui" : "Permintaan Ditolak",
        color: isAccepted ? "bg-teal-600" : "bg-orange-600",
        icon: isAccepted ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />
      };
    }
    default: return { label: action, color: "bg-slate-600", icon: <Activity className="w-3 h-3" /> };
  }
}

function getEntityLabel(entity: string) {
  switch (entity) {
    case "TaxData":
    case "TaxMapping":
      return "Data Pajak (PBB)";
    case "User": return "Pengguna";
    case "DusunReference": return "Referensi Dusun";
    case "VillageConfig": return "Pengaturan Desa";
    default: return entity;
  }
}

export default async function AuditLogPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string, page?: string }>
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const limit = 50;

  const { logs, total } = await getAuditLogs(limit, page, query);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Log Aktivitas (Audit Trail)
          </h1>
          <p className="text-muted-foreground mt-1">
            Rekam jejak seluruh aktivitas penting dan modifikasi data dalam sistem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <LogSearch defaultValue={query} />
          </div>
        </div>
      </div>

      <Card className="glass border-none shadow-xl">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Riwayat Sistem</CardTitle>
              <CardDescription>
                {query ? `Hasil pencarian untuk "${query}"` : "Menampilkan aktivitas terbaru"}
              </CardDescription>
            </div>
            <div className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
              Total: {total.toLocaleString()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50 max-h-[70vh] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic text-sm">Belum ada riwayat aktivitas tercatat.</div>
            ) : (
              logs.map((log: any) => {
                const badgeInfo = getActionLabel(log.action, log.details);
                return (
                  <div key={log.id} className="p-4 md:p-6 flex gap-4 hover:bg-muted/10 transition-colors">
                    <div className="mt-1 hidden sm:block">
                      <div className={`p-2 rounded-full text-white ${badgeInfo.color}`}>
                        {badgeInfo.icon}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${badgeInfo.color} text-white hover:${badgeInfo.color} border-none`}>
                            {badgeInfo.label}
                          </Badge>
                          <span className="text-sm font-semibold flex items-center gap-1.5 opacity-80">
                            <UserCircle className="w-4 h-4 text-primary" />
                            {log.user ? `${log.user.name} (${log.user.username})` : "Sistem Otomatis (Auto)"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-muted/50 px-2 py-1 rounded-md w-fit">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(log.createdAt), "dd MMM yyyy • HH:mm", { locale: id })}
                        </span>
                      </div>

                      <p className="text-sm text-foreground/80 leading-relaxed italic">
                        {log.entityId ? (
                          <>
                            Melakukan perubahan pada <span className="font-semibold text-primary not-italic">{getEntityLabel(log.entity)}</span>
                            <span className="not-italic">
                              {log.entity === "TaxData" || log.entity === "TaxMapping" ? " untuk Wajib Pajak: " : " dengan ID: "}
                              <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold text-xs">{log.entityId}</code>
                            </span>
                          </>
                        ) : (
                          <>
                            Menjalankan proses sistem pada modul <span className="font-semibold text-primary not-italic">{getEntityLabel(log.entity)}</span>
                          </>
                        )}
                      </p>

                      {log.details && (
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <LogPagination totalPages={totalPages} currentPage={page} />
        </CardContent>
      </Card>
    </div>
  );
}
