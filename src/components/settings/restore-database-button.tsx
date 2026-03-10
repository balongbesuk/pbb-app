"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DatabaseZap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function RestoreDatabaseButton() {
    const [isUploading, setIsUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file extension
        if (!file.name.endsWith(".zip")) {
            toast.error("Format file tidak valid. Harap unggah file .zip hasil backup.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setSelectedBackupFile(file);
        setConfirmText("");
        setIsDialogOpen(true);
    };

    const confirmRestore = async () => {
        if (!selectedBackupFile) return;

        setIsDialogOpen(false);
        setIsUploading(true);
        const toastId = toast.loading("Memulihkan database... Mohon tunggu.");

        try {
            const formData = new FormData();
            formData.append("file", selectedBackupFile);

            const response = await fetch("/api/restore", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Database berhasil dipulihkan", { id: toastId });
                // Memberi waktu aplikasi untuk restart/sync
                setTimeout(() => {
                    window.location.href = "/login"; // Force reload and login again
                }, 2000);
            } else {
                throw new Error(result.error || "Gagal memulihkan database");
            }
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsUploading(false);
            setSelectedBackupFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const cancelRestore = () => {
        setIsDialogOpen(false);
        setSelectedBackupFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".zip"
                className="hidden"
            />
            <Button
                variant="destructive"
                className="w-full gap-2 font-bold text-white bg-rose-600/90 hover:bg-rose-600 shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseZap className="w-4 h-4" />}
                Restore Database
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && cancelRestore()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Peringatan Pemulihan Data
                        </DialogTitle>
                        <DialogDescription className="pt-3 space-y-4 text-foreground/80">
                            <span className="block">
                                Anda akan memulihkan database dari file backup. Tindakan ini akan <strong>menghapus seluruh data yang ada saat ini secara permanen</strong> dan menggantikannya dengan versi backup.
                            </span>

                            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-xs font-semibold">
                                Peringatan: Data yang sudah terhapus tidak dapat dikembalikan sesudahnya.
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="confirm-text" className="text-foreground">
                                    Ketik <span className="font-bold select-all">RESTORE DATABASE</span> untuk konfirmasi:
                                </Label>
                                <Input
                                    id="confirm-text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Masukkan teks konfirmasi..."
                                    className="bg-white/50"
                                    autoComplete="off"
                                />
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 flex-col-reverse sm:flex-row">
                        <Button variant="outline" onClick={cancelRestore} className="w-full sm:w-auto">
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmRestore}
                            disabled={confirmText !== "RESTORE DATABASE"}
                            className="w-full sm:w-auto"
                        >
                            Saya mengerti, pulihkan data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
