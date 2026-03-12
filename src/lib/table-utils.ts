import { toast } from "sonner";

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: string; label: string }[],
  filename: string
) {
  if (data.length === 0) {
    toast.info("Nenhum dado para exportar.");
    return;
  }
  const headerRow = headers.map((h) => h.label).join(",");
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h.key];
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );
  const csv = [headerRow, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
  toast.success("CSV exportado com sucesso!");
}

export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: string; label: string }[],
  title: string
) {
  if (data.length === 0) {
    toast.info("Nenhum dado para exportar.");
    return;
  }
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const tableRows = data
    .map(
      (row) =>
        `<tr>${headers
          .map((h) => `<td style="border:1px solid #ddd;padding:8px;">${String(row[h.key] ?? "")}</td>`)
          .join("")}</tr>`
    )
    .join("");

  printWindow.document.write(`
    <html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}
    th{background:#333;color:#fff;padding:10px;text-align:left;border:1px solid #ddd}
    td{padding:8px;border:1px solid #ddd}h1{margin-bottom:16px}</style></head>
    <body><h1>${title}</h1><table><thead><tr>${headers
      .map((h) => `<th>${h.label}</th>`)
      .join("")}</tr></thead><tbody>${tableRows}</tbody></table></body></html>
  `);
  printWindow.document.close();
  printWindow.print();
  toast.success("PDF gerado com sucesso!");
}

export function printTable<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: string; label: string }[],
  title: string
) {
  exportToPDF(data, headers, title);
}

export function copyToClipboard<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: string; label: string }[]
) {
  if (data.length === 0) {
    toast.info("Nenhum dado para copiar.");
    return;
  }
  const headerRow = headers.map((h) => h.label).join("\t");
  const rows = data.map((row) =>
    headers.map((h) => String(row[h.key] ?? "")).join("\t")
  );
  const text = [headerRow, ...rows].join("\n");
  navigator.clipboard.writeText(text);
  toast.success("Dados copiados para a área de transferência!");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
