import { useState, useMemo } from "react";

interface UseTableOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  pageSize?: number;
}

export function useTable<T extends Record<string, unknown>>({
  data,
  searchKeys,
  pageSize: initialPageSize = 10,
}: UseTableOptions<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) =>
        String(item[key] ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [data, search, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const from = filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const to = Math.min(currentPage * pageSize, filtered.length);

  return {
    search,
    setSearch,
    page: currentPage,
    setPage,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    filtered,
    paginatedData,
    totalPages,
    from,
    to,
    total: filtered.length,
    canPrev: currentPage > 1,
    canNext: currentPage < totalPages,
    prev: () => setPage((p) => Math.max(1, p - 1)),
    next: () => setPage((p) => Math.min(totalPages, p + 1)),
    paginationLabel: `Mostrando ${from} até ${to} de ${filtered.length} registros`,
  };
}
