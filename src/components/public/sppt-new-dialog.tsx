"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FilePlus2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpptNewForm } from "./sppt-new-form";

interface SpptNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  isDark?: boolean;
}

export function SpptNewDialog({
  open,
  onOpenChange,
  initialName = "",
}: SpptNewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "max-w-4xl w-[95vw] lg:w-[1100px] lg:max-w-[1100px] h-[92vh] overflow-hidden flex flex-col p-0 border-none sm:rounded-3xl shadow-2xl !opacity-100 dark:bg-[#050B14] bg-white",
        )}
      >
        <div className="absolute inset-0 -z-50 bg-background" />
        
        <DialogHeader className="p-4 sm:p-6 pb-2 border-b dark:border-white/5 dark:bg-[#0D1F3D] border-slate-100 bg-white">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl group shadow-inner">
                <FilePlus2 className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
             </div>
             <div>
               <DialogTitle className="text-xl font-black uppercase tracking-tight dark:text-white text-slate-900">Pengajuan SPPT Baru</DialogTitle>
               <DialogDescription className="dark:text-blue-100/60 text-slate-500">Formulir pendaftaran Objek Pajak baru (belum pernah terbit SPPT).</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <SpptNewForm initialName={initialName} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
