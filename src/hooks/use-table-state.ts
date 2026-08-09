"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TableState {
  page: number;
  search: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
}

export function useTableState(defaultSort: string | null = null) {
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(defaultSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPage(1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(v), 300);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onSortChange = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  return {
    page,
    setPage,
    search,
    debouncedSearch,
    setSearch,
    sortKey,
    sortDir,
    onSortChange,
  };
}
