import { Archive, ArrowLeft } from "lucide-react";
import { ArchiveManager } from "@/components/settings/archive-manager";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ArsipPbbPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                   <ArrowLeft className="h-4 w-4" />
                </Button>
             </Link>
             <h1 className="text-3xl font-bold tracking-tight">Arsip Digital PBB</h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Kelola file E-SPPT digital dan gunakan fitur Smart Scan untuk pemisahan otomatis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ArchiveManager />
      </div>
    </div>
  );
}
