"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

export function DashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentParams = new URLSearchParams(searchParams?.toString() ?? "");

  const currentYear = currentParams.get("tahun") || new Date().getFullYear().toString();
  const currentYearNum = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYearNum + 1 - i).toString());

  const handleYearChange = (val: string) => {
    const params = new URLSearchParams(currentParams);
    params.set("tahun", val);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
      <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 whitespace-nowrap">
        Tahun Pajak:
      </Label>
      <Select value={currentYear} onValueChange={(val) => handleYearChange(val || "")}>
        <SelectTrigger className="h-8 w-[95px] border-none bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white font-black text-xs rounded-xl shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800 shadow-xl">
          {years.map((y) => (
            <SelectItem key={y} value={y} className="font-bold text-xs">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
