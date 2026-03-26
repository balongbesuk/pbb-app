import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  itemName?: string;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Hapus Data?",
  description,
  itemName,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
      <DialogContent className="overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[400px]">
        {/* Header strip */}
        <div className="flex flex-col items-center gap-4 bg-rose-50 px-6 sm:px-8 pt-8 pb-6 dark:bg-rose-950/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-white shadow-sm dark:border-rose-900 dark:bg-rose-950/30">
            <AlertTriangle className="h-7 w-7 text-rose-500" />
          </div>
          <DialogHeader className="space-y-1 p-0 text-center">
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground/80 text-sm leading-relaxed">
              {description || (
                <>
                  Anda akan menghapus <strong className="text-foreground">{itemName}</strong> secara
                  permanen. Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col justify-end gap-3 bg-white px-6 sm:px-8 py-6 sm:flex-row dark:bg-zinc-950">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-10 rounded-xl border-zinc-200 px-6 font-bold dark:border-zinc-800"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-10 gap-2 rounded-xl px-6 font-bold shadow-sm shadow-rose-500/20"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
