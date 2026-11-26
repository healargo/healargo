"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS_COPY } from "@/constants/business";
import {
  formatMoney,
  previewTotal,
} from "@/lib/business/format";
import { BusinessProductField } from "@/components/features/admin/business/BusinessProductField";
import type { BusinessProductOption } from "@/types/business";

export interface BusinessLineFormState {
  date: string;
  productId: string;
  productName: string;
  price: string;
  litres: string;
}

export function BusinessLineFields({
  products,
  form,
  onChange,
  totalLabel,
}: {
  products: BusinessProductOption[];
  form: BusinessLineFormState;
  onChange: (next: BusinessLineFormState) => void;
  totalLabel: string;
}) {
  const total = previewTotal(form.price, form.litres);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="business-date">{BUSINESS_COPY.date}</Label>
        <Input
          id="business-date"
          type="date"
          className="mt-1.5"
          value={form.date}
          onChange={(e) => onChange({ ...form, date: e.target.value })}
        />
      </div>
      <BusinessProductField
        products={products}
        productId={form.productId}
        productName={form.productName}
        onChange={(next) => onChange({ ...form, ...next })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="business-price">{BUSINESS_COPY.price}</Label>
          <Input
            id="business-price"
            type="number"
            step="any"
            min="0"
            className="mt-1.5"
            value={form.price}
            onChange={(e) => onChange({ ...form, price: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="business-litres">{BUSINESS_COPY.litres}</Label>
          <Input
            id="business-litres"
            type="number"
            step="any"
            min="0"
            className="mt-1.5"
            value={form.litres}
            onChange={(e) => onChange({ ...form, litres: e.target.value })}
          />
        </div>
      </div>
      <div className="rounded-xl border border-border/80 bg-cream/40 px-3 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {totalLabel}
        </p>
        <p className="mt-1 font-display text-xl text-dark">
          {formatMoney(total)}
        </p>
        <p className="mt-1 text-xs text-muted">{BUSINESS_COPY.autoTotalHint}</p>
      </div>
    </div>
  );
}
