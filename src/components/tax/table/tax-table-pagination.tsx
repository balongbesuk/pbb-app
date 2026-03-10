"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TaxTablePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    total: number;
    shownCount: number;
}

export function TaxTablePagination({
    currentPage,
    totalPages,
    onPageChange,
    total,
    shownCount
}: TaxTablePaginationProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-xs text-muted-foreground font-medium italic">
                Menampilkan {shownCount} dari {total} data PBB
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 transition-all px-3 font-semibold"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1.5" /> Sebelumnya
                </Button>
                <div className="text-xs font-bold px-4 py-1.5 bg-muted/50 rounded-md border border-border/50">
                    Halaman <span className="text-primary">{currentPage}</span> dari {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 transition-all px-3 font-semibold"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Selanjutnya <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
            </div>
        </div>
    );
}
