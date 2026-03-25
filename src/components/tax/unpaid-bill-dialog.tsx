"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Info, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnpaidBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nop: string;
  namaWp: string;
  isDark?: boolean;
}

export function UnpaidBillDialog({
  open,
  onOpenChange,
  nop,
  namaWp,
  isDark = false,
}: UnpaidBillDialogProps) {
  const handlePayNow = () => {
    window.open(`https://bapenda.jombangkab.go.id/epay/epaypbb.php?orc=dataGIS&nopGIS=${nop}`, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "rounded-3xl border-none p-5 sm:p-8 max-w-[95vw] sm:max-w-[420px] shadow-2xl",
        isDark ? "bg-[#0A192F] text-white" : "bg-white text-slate-900"
      )}>
        <DialogHeader className="space-y-4">
          <div className="flex flex-col items-center text-center gap-3">
             <div className="p-3 bg-emerald-500/10 rounded-full">
                <Wallet className="w-8 h-8 text-emerald-500" />
             </div>
             <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
               Tagihan Belum Lunas
             </DialogTitle>
          </div>
          <DialogDescription className={cn(
            "pt-2 text-[13px] sm:text-sm font-medium leading-relaxed text-center",
            isDark ? "text-blue-100/70" : "text-slate-600"
          )}>
            Sistem telah mengecek ke Bapenda Jombang. Tagihan atas nama <strong className="font-black text-primary uppercase">{namaWp}</strong> dengan NOP <span className="font-bold underline decoration-zinc-500/30 underline-offset-4">{nop}</span> masih tercatat <span className="text-rose-600 dark:text-rose-400 font-black">BELUM LUNAS</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className={cn(
          "my-4 p-4 rounded-2xl border",
          isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
        )}>
           <p className="text-xs font-bold leading-relaxed flex items-center justify-center gap-2 text-center">
             <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
             Ingin melunasi sekarang secara online? Anda bisa menggunakan layanan resmi E-PAY Bapenda Jombang.
           </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
          <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-full sm:w-auto rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 border-zinc-200 dark:border-zinc-800",
                isDark ? "hover:bg-white/5 text-blue-200" : "hover:bg-zinc-50 text-slate-500"
              )}
          >
            Nanti Saja
          </Button>
          <Button 
              className="w-full sm:flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-900/20 border-none group transition-all"
              onClick={handlePayNow}
          >
            <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Bayar Online Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
