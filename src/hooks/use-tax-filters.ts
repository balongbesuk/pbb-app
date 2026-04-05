"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

export function useTaxFilters() {
  const rawSearchParams = useSearchParams();
  const searchParamsString = rawSearchParams?.toString() ?? "";
  const pathnameValue = usePathname() ?? "/data-pajak";
  const currentYear = useMemo(() => new Date().getFullYear().toString(), []);
  const searchParams = useMemo(() => new URLSearchParams(searchParamsString), [searchParamsString]);

  const router = useRouter();
  const [, startTransition] = useTransition();

  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const tahun = searchParams.get("tahun") || currentYear;
  const dusun = searchParams.get("dusun") || "all";
  const rw = searchParams.get("rw") || "all";
  const rt = searchParams.get("rt") || "all";
  const penarik = searchParams.get("penarik") || "all";
  const regionStatus = searchParams.get("regionStatus") || "all";
  const paymentStatus = searchParams.get("paymentStatus") || "all";
  const archiveStatus = searchParams.get("archiveStatus") || "all";
  const sortBy = searchParams.get("sortBy") || "nop";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  const updateParam = useCallback(
    (key: string, value: string | number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === "all" || (key === "page" && value === 1)) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      // Always reset to page 1 when a filter changes (except when changing page or sorting)
      if (key !== "page" && key !== "sortBy" && key !== "sortOrder") {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`${pathnameValue}?${params.toString()}`);
      });
    },
    [searchParams, router, pathnameValue, startTransition]
  );

  const setQ = useCallback((v: string | null) => updateParam("q", v || ""), [updateParam]);
  const setPage = useCallback((v: number) => updateParam("page", v), [updateParam]);
  const setSort = useCallback((field: string) => {
    const isNewField = sortBy !== field;
    const newOrder = isNewField ? "asc" : sortOrder === "asc" ? "desc" : "asc";
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", field);
    params.set("sortOrder", newOrder);
    
    startTransition(() => {
      router.push(`${pathnameValue}?${params.toString()}`);
    });
  }, [searchParams, sortBy, sortOrder, router, pathnameValue, startTransition]);
  const setTahun = useCallback((v: string | null) => updateParam("tahun", v || ""), [updateParam]);
  const setDusun = useCallback((v: string | null) => updateParam("dusun", v || "all"), [updateParam]);
  const setRw = useCallback((v: string | null) => updateParam("rw", v || "all"), [updateParam]);
  const setRt = useCallback((v: string | null) => updateParam("rt", v || "all"), [updateParam]);
  const setPenarik = useCallback((v: string | null) => updateParam("penarik", v || "all"), [updateParam]);
  const setRegionStatus = useCallback((v: string | null) => updateParam("regionStatus", v || "all"), [updateParam]);
  const setPaymentStatus = useCallback((v: string | null) => updateParam("paymentStatus", v || "all"), [updateParam]);
  const setArchiveStatus = useCallback((v: string | null) => updateParam("archiveStatus", v || "all"), [updateParam]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    const t = searchParams.get("tahun");
    if (t) params.set("tahun", t);
    startTransition(() => {
      router.push(`${pathnameValue}?${params.toString()}`);
    });
  }, [searchParams, router, pathnameValue, startTransition]);

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
    archiveStatus, setArchiveStatus,
    sortBy, sortOrder, setSort,
    clearFilters,
  };
}
