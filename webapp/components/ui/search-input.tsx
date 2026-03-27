"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  paramKey?: string;
}

export function SearchInput({ placeholder = "Search…", paramKey = "q" }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramKey) ?? "";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (e.target.value) {
        params.set(paramKey, e.target.value);
      } else {
        params.delete(paramKey);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, paramKey]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        defaultValue={current}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
