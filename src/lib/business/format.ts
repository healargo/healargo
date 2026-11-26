import { computeLineTotal } from "@/lib/business/totals";
import { formatInr } from "@/lib/utils/format";

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function formatBusinessDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return formatInr(value);
}

export function previewTotal(
  price: string,
  litres: string,
): number | null {
  const p = price === "" ? null : Number(price);
  const l = litres === "" ? null : Number(litres);
  if (p == null || l == null || Number.isNaN(p) || Number.isNaN(l)) return null;
  return computeLineTotal(p, l);
}

export function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}
