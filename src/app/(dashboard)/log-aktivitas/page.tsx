import { getAuditLogs } from "@/app/actions/log-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, UserCircle, Activity, Box, Search, Calendar, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function getActionLabel(action: string) {
  switch (action) {
    case "UPLOAD_TAX": return { label: "Upload Data", color: "bg-blue-500", icon: <FileText className="w-3 h-3" /> };
    case "CLEAR_TAX": return { label: "Hapus Data Tahunan", color: "bg-red-500", icon: <Activity className="w-3 h-3" /> };
    case "UPDATE_PAYMENT": return { label: "Ubah Status Lunas", color: "bg-emerald-500", icon: <ShieldCheck className="w-3 h-3" /> };
    case "ASSIGN_TAX": return { label: "Tugaskan PBB", color: "bg-indigo-500", icon: <UserCircle className="w-3 h-3" /> };
    case "UPDATE_REGION": return { label: "Ubah Wilayah RT/RW", color: "bg-amber-500", icon: <Box className="w-3 h-3" /> };
    default: return { label: action, color: "bg-slate-500", icon: <Activity className="w-3 h-3" /> };
  }
}

export default async function AuditLogPage() {
  const logs = await getAuditLogs(200);

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
      </div>

      <Card className="glass border-none shadow-xl">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle>Riwayat Sistem</CardTitle>
          <CardDescription>Menampilkan hingga 200 aktivitas terakhir</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50 max-h-[70vh] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic text-sm">Belum ada riwayat aktivitas tercatat.</div>
            ) : (
              logs.map((log) => {
                const badgeInfo = getActionLabel(log.action);
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
                       
                       <p className="text-sm text-foreground/80 leading-relaxed">
                         Mengeksekusi tindakan pada modul <span className="font-semibold text-primary">{log.entity}</span> 
                         {log.entityId && <span> ID target: <code className="bg-muted px-1 py-0.5 rounded text-xs">{log.entityId}</code></span>}
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
        </CardContent>
      </Card>
    </div>
  );
}
