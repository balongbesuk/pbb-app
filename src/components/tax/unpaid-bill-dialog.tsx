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
  container?: HTMLElement | null;
  bapendaPaymentUrl?: string | null;
  bapendaUrl?: string | null;
  enableBapendaPayment?: boolean;
  enableBapendaSync?: boolean;
  isJombangBapenda?: boolean;
  bapendaRegionName?: string | null;
}

export function UnpaidBillDialog({
  open,
  onOpenChange,
  nop,
  namaWp,
  isDark = false,
  container,
  bapendaPaymentUrl,
  bapendaUrl,
  enableBapendaPayment = true,
  enableBapendaSync = true,
  isJombangBapenda = false,
  bapendaRegionName = "Bapenda",
}: UnpaidBillDialogProps) {
  const handleAction = () => {
    const configUrl = enableBapendaPayment ? bapendaPaymentUrl : bapendaUrl;
    if (!configUrl) return;

    const cleanNop = nop.replace(/\D/g, "");
    let finalUrl = "";

    if (!enableBapendaPayment && isJombangBapenda && cleanNop.length === 18) {
      const baseUrl = configUrl.split("?")[0];
      const k = [
        cleanNop.substring(0, 2),
        cleanNop.substring(2, 4),
        cleanNop.substring(4, 7),
        cleanNop.substring(7, 10),
        cleanNop.substring(10, 13),
        cleanNop.substring(13, 17),
        cleanNop.substring(17, 18),
      ];
      finalUrl = `${baseUrl}?module=pbb&kata=${k[0]}&kata1=${k[1]}&kata2=${k[2]}&kata3=${k[3]}&kata4=${k[4]}&kata5=${k[5]}&kata6=${k[6]}&viewpbb=`;
    } else {
      finalUrl = configUrl.replace(/\{nop\}/gi, cleanNop);
    }

    if (finalUrl) {
      window.open(finalUrl, "_blank");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent container={container} className={cn(
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
            Sistem telah mengecek ke {bapendaRegionName}. Tagihan atas nama <strong className="font-black text-primary uppercase">{namaWp}</strong> dengan NOP <span className="font-bold underline decoration-zinc-500/30 underline-offset-4">{nop}</span> masih tercatat <span className="text-rose-600 dark:text-rose-400 font-black">BELUM LUNAS</span>.
          </DialogDescription>
        </DialogHeader>
        
        {(enableBapendaPayment || enableBapendaSync) && (enableBapendaPayment ? bapendaPaymentUrl : bapendaUrl) && (
          <div className={cn(
            "my-4 p-4 rounded-2xl border text-center",
            isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
          )}>
             <p className="text-xs font-bold leading-relaxed flex items-center justify-center gap-2">
               <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
               {enableBapendaPayment 
                 ? `Ingin melunasi sekarang secara online? Anda bisa menggunakan layanan resmi ${bapendaRegionName}.`
                 : `Anda dapat mengecek detail tagihan atau melakukan pembayaran melalui portal resmi ${bapendaRegionName}.`}
             </p>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
          <Button 
              variant="secondary" 
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-full sm:w-auto rounded-2xl font-black uppercase tracking-widest text-[11px] h-12 transition-all",
                "flex-1",
                isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
          >
            Tutup
          </Button>
          {(enableBapendaPayment || enableBapendaSync) && (enableBapendaPayment ? bapendaPaymentUrl : bapendaUrl) && (
            <Button 
                className={cn(
                  "w-full sm:flex-1 h-12 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg border-none group transition-all",
                  enableBapendaPayment ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20"
                )}
                onClick={handleAction}
            >
              <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {enableBapendaPayment ? 'Bayar Online' : 'Cek Web Bapenda'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
