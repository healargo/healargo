export function computeLineTotal(
  price: number | null | undefined,
  litres: number | null | undefined,
): number | null {
  if (price == null || litres == null) return null;
  if (Number.isNaN(price) || Number.isNaN(litres)) return null;
  return Math.round(price * litres * 100) / 100;
}

export function deriveCreditStatus(
  totalPrice: number | null | undefined,
  amountPaid: number | null | undefined,
): "UNPAID" | "PARTIAL" | "PAID" {
  const paid = amountPaid ?? 0;
  const total = totalPrice ?? 0;
  if (paid <= 0) return "UNPAID";
  if (total > 0 && paid >= total) return "PAID";
  if (paid > 0) return "PARTIAL";
  return "UNPAID";
}
