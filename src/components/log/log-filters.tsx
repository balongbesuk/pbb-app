"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Search, X, Calendar as CalendarIcon, User as UserIcon, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface LogFiltersProps {
  users: { id: string, name: string | null }[];
  actions: { value: string, label: string }[];
}

export function LogFilters({ users, actions }: LogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedPathname = pathname ?? "/log-aktivitas";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";
  
  const query = searchParams?.get("q") ?? "";
  const filterAction = searchParams?.get("action") ?? "all";
  const filterUser = searchParams?.get("user") ?? "all";
  const startDate = searchParams?.get("start") ?? "";
  const endDate = searchParams?.get("end") ?? "";

  const [searchValue, setSearchValue] = useState(query);
  const debouncedSearch = useDebounce(searchValue, 500);

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParamsString);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value as string);
      }
    });
    params.set("page", "1");
    router.push(`${resolvedPathname}?${params.toString()}`);
  }, [resolvedPathname, router, searchParamsString]);

  useEffect(() => {
    if (debouncedSearch !== query) {
      updateFilters({ q: debouncedSearch });
    }
  }, [debouncedSearch, query, updateFilters]);

  const hasFilters = query || filterAction !== "all" || filterUser !== "all" || startDate || endDate;

  const clearFilters = () => {
    setSearchValue("");
    router.push(resolvedPathname);
  };

  const currentActionLabel = actions.find(a => a.value === filterAction)?.label || "Semua Aksi";
  const currentUserObj = users.find(u => u.id === filterUser);
  const currentUserLabel = currentUserObj ? (currentUserObj.name || "User: " + currentUserObj.id.slice(0, 8)) : "Semua Petugas";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Cari aktivitas, user, atau data..."
            className="focus-visible:ring-primary/20 border-none bg-white/70 dark:bg-zinc-900/50 pl-10 shadow-sm focus-visible:ring-1 rounded-2xl h-11"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <Select value={filterAction} onValueChange={(v) => updateFilters({ action: v })}>
            <SelectTrigger className="min-w-[160px] h-11 rounded-2xl border-none bg-white dark:bg-zinc-900/50 shadow-sm font-bold text-xs">
              <div className="flex items-center gap-2 pr-2">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="truncate max-w-[120px]">{currentActionLabel}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl bg-white dark:bg-zinc-950">
              <SelectItem value="all" className="font-bold text-xs rounded-xl">Semua Aksi Sistem</SelectItem>
              {actions.map((act) => (
                <SelectItem key={act.value} value={act.value} className="text-xs rounded-xl font-medium">
                  {act.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* User Filter */}
          <Select value={filterUser} onValueChange={(v) => updateFilters({ user: v })}>
            <SelectTrigger className="min-w-[180px] h-11 rounded-2xl border-none bg-white dark:bg-zinc-900/50 shadow-sm font-bold text-xs">
              <div className="flex items-center gap-2 pr-2">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span className="truncate max-w-[140px]">{currentUserLabel}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl bg-white dark:bg-zinc-950">
              <SelectItem value="all" className="font-bold text-xs rounded-xl">Semua Petugas Desa</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id} className="text-xs rounded-xl font-medium">
                  {user.name || "User ID: " + user.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filters */}
          <div className="flex items-center gap-2 h-11 px-3 rounded-2xl bg-white dark:bg-zinc-900/50 shadow-sm border-none transition-all focus-within:ring-1 focus-within:ring-primary/20">
            <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="flex flex-col -gap-1">
              <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-tighter ml-0.5">Mulai</span>
              <input 
                type="date" 
                className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-tighter w-[110px] p-0 dark:invert-[0.9] dark:hue-rotate-180" 
                value={startDate}
                onChange={(e) => updateFilters({ start: e.target.value })}
              />
            </div>
            <span className="text-[10px] opacity-20 font-black">→</span>
            <div className="flex flex-col -gap-1">
              <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-tighter ml-0.5">Selesai</span>
              <input 
                type="date" 
                className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-tighter w-[110px] p-0 dark:invert-[0.9] dark:hue-rotate-180" 
                value={endDate}
                onChange={(e) => updateFilters({ end: e.target.value })}
              />
            </div>
          </div>

          {hasFilters && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-none transition-all shadow-sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
