"use client";

import {
  BusinessLineFields,
  type BusinessLineFormState,
} from "@/components/features/admin/business/BusinessLineFields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUSINESS_COPY,
  CREDIT_STATUS_OPTIONS,
} from "@/constants/business";
import { formatMoney } from "@/lib/business/format";
import { deriveCreditStatus } from "@/lib/business/totals";
import type { BusinessProductOption, CreditStatus } from "@/types/business";

export type CreditFormState = BusinessLineFormState & {
  shopName: string;
  amountPaid: string;
  expectedCollectionDate: string;
  status: CreditStatus;
};

export function CreditFormFields({
  products,
  form,
  onChange,
  total,
  paid,
  remaining,
}: {
  products: BusinessProductOption[];
  form: CreditFormState;
  onChange: (next: Partial<CreditFormState>) => void;
  total: number | null;
  paid: number;
  remaining: number | null;
}) {
  return (
    <>
      <div>
        <Label htmlFor="credit-shop">{BUSINESS_COPY.shopName}</Label>
        <Input
          id="credit-shop"
          className="mt-1.5"
          value={form.shopName}
          onChange={(e) => onChange({ shopName: e.target.value })}
        />
      </div>
      <BusinessLineFields
        products={products}
        form={form}
        onChange={(next) => onChange(next)}
        totalLabel={BUSINESS_COPY.totalPrice}
      />
      <div>
        <Label htmlFor="credit-collect-on">
          {BUSINESS_COPY.expectedCollectionDate}
        </Label>
        <Input
          id="credit-collect-on"
          type="date"
          className="mt-1.5"
          value={form.expectedCollectionDate}
          onChange={(e) =>
            onChange({ expectedCollectionDate: e.target.value })
          }
        />
        <p className="mt-1 text-xs text-muted">{BUSINESS_COPY.collectOn}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="credit-paid">{BUSINESS_COPY.amountPaid}</Label>
          <Input
            id="credit-paid"
            type="number"
            step="any"
            min="0"
            className="mt-1.5"
            value={form.amountPaid}
            onChange={(e) => onChange({ amountPaid: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="credit-status">{BUSINESS_COPY.status}</Label>
          <select
            id="credit-status"
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={deriveCreditStatus(total, paid)}
            disabled
          >
            {CREDIT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-sm text-muted">
        {BUSINESS_COPY.remaining}: {formatMoney(remaining)}
      </p>
    </>
  );
}
