"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

export function useTaxFilters() {
  const rawSearchParams = useSearchParams();
  // Guard against null (can happen in SSR edge cases, but hook is always client-side)
  const searchParams = rawSearchParams ?? new URLSearchParams();

  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
  const dusun = searchParams.get("dusun") || "all";
  const rw = searchParams.get("rw") || "all";
  const rt = searchParams.get("rt") || "all";
  const penarik = searchParams.get("penarik") || "all";
  const regionStatus = searchParams.get("regionStatus") || "all";
  const paymentStatus = searchParams.get("paymentStatus") || "all";

  const updateParam = useCallback(
    (key: string, value: string | number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === "all" || value === 1) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      // Always reset to page 1 when a filter changes (except when changing page)
      if (key !== "page") {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, router, pathname]
  );

  const setQ = useCallback((v: string | null) => updateParam("q", v || ""), [updateParam]);
  const setPage = useCallback((v: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v <= 1) params.delete("page");
    else params.set("page", String(v));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [searchParams, router, pathname]);
  const setTahun = useCallback((v: string | null) => updateParam("tahun", v || ""), [updateParam]);
  const setDusun = useCallback((v: string | null) => updateParam("dusun", v || "all"), [updateParam]);
  const setRw = useCallback((v: string | null) => updateParam("rw", v || "all"), [updateParam]);
  const setRt = useCallback((v: string | null) => updateParam("rt", v || "all"), [updateParam]);
  const setPenarik = useCallback((v: string | null) => updateParam("penarik", v || "all"), [updateParam]);
  const setRegionStatus = useCallback((v: string | null) => updateParam("regionStatus", v || "all"), [updateParam]);
  const setPaymentStatus = useCallback((v: string | null) => updateParam("paymentStatus", v || "all"), [updateParam]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    const t = searchParams.get("tahun");
    if (t) params.set("tahun", t);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [searchParams, router, pathname]);

  return {
    q, setQ,
    page, setPage,
    tahun, setTahun,
    dusun, setDusun,
    rw, setRw,
    rt, setRt,
    penarik, setPenarik,
    regionStatus, setRegionStatus,
    paymentStatus, setPaymentStatus,
    clearFilters,
  };
}
