"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function DashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYear = searchParams.get("tahun") || new Date().getFullYear().toString();
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const handleYearChange = (val: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tahun", val);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4 glass p-2 px-4 rounded-xl border-white/20">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Tahun Pajak</Label>
        <Select value={currentYear} onValueChange={(val) => handleYearChange(val || "")}>
          <SelectTrigger className="w-[100px] h-9 bg-white/50 border-none shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
