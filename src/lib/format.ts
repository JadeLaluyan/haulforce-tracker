export function peso(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `₱${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function pesoWhole(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(d: string | Date | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}
