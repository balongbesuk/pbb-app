"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, RotateCcw } from "lucide-react";

type Props = {
  dusuns: string[];
  bloks: string[];
  rws: string[];
  rts: string[];
};

export function LaporanGisFilters({ dusuns, bloks, rws, rts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [dusun, setDusun] = useState(searchParams.get("dusun") || "");
  const [blok, setBlok] = useState(searchParams.get("blok") || "");
  const [rw, setRw] = useState(searchParams.get("rw") || "");
  const [rt, setRt] = useState(searchParams.get("rt") || "");

  function applyFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset page on filter change
    params.set("page", "1");

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ q });
  }

  function handleReset() {
    setQ("");
    setDusun("");
    setBlok("");
    setRw("");
    setRt("");
    startTransition(() => {
      router.push(`?tahun=${searchParams.get("tahun") || new Date().getFullYear()}`);
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-3xl p-5 shadow-sm space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nama, NOP, atau alamat..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/10"
        >
          Cari
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Dusun */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Dusun</label>
          <select
            value={dusun}
            onChange={(e) => {
              setDusun(e.target.value);
              applyFilters({ dusun: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Semua Dusun</option>
            {dusuns.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Blok */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Blok</label>
          <select
            value={blok}
            onChange={(e) => {
              setBlok(e.target.value);
              applyFilters({ blok: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Semua Blok</option>
            {bloks.map((b) => (
              <option key={b} value={b}>
                Blok {b}
              </option>
            ))}
          </select>
        </div>

        {/* RW */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">RW</label>
          <select
            value={rw}
            onChange={(e) => {
              setRw(e.target.value);
              applyFilters({ rw: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Semua RW</option>
            {rws.map((r) => (
              <option key={r} value={r}>
                RW {r}
              </option>
            ))}
          </select>
        </div>

        {/* RT */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">RT</label>
          <select
            value={rt}
            onChange={(e) => {
              setRt(e.target.value);
              applyFilters({ rt: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Semua RT</option>
            {rts.map((r) => (
              <option key={r} value={r}>
                RT {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(q || dusun || blok || rw || rt) && (
        <div className="flex justify-end pt-1">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
