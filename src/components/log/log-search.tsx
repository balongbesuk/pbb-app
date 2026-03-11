"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce"; // I'll check if this exists, if not I'll create it

export function LogSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 500);

  // Sync internal state with URL params (e.g. when menu is clicked to clear search)
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") || "";

    // Only update the URL if the value has actually changed from what's in the current URL
    // This prevents resetting page=1 when we are just paginating, or infinite loops
    if (debouncedValue !== currentQuery) {
      const params = new URLSearchParams(searchParams);
      if (debouncedValue) {
        params.set("q", debouncedValue);
      } else {
        params.delete("q");
      }
      params.set("page", "1"); // Reset to page 1 on search
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [debouncedValue, pathname, router, searchParams]);

  return (
    <Input
      placeholder="Cari aktivitas, user, atau data..."
      className="focus-visible:ring-primary/20 border-none bg-white/50 dark:bg-[#111827]/50 pl-10 shadow-none focus-visible:ring-1"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
