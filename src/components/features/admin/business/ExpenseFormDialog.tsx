"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BusinessLineFields,
  type BusinessLineFormState,
} from "@/components/features/admin/business/BusinessLineFields";
import { AdminFormDialog } from "@/components/features/admin/AdminFormDialog";
import { Button } from "@/components/ui/button";
import { BUSINESS_COPY } from "@/constants/business";
import { API_ENDPOINTS } from "@/constants/api";
import {
  parseOptionalNumber,
  toDateInputValue,
} from "@/lib/business/format";
import type { BusinessExpense, BusinessProductOption } from "@/types/business";

const emptyForm: BusinessLineFormState = {
  date: "",
  productId: "",
  productName: "",
  price: "",
  litres: "",
};

export function ExpenseFormDialog({
  open,
  onOpenChange,
  partnerId,
  products,
  expense,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  products: BusinessProductOption[];
  expense?: BusinessExpense | null;
  onDone: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!expense) {
      setForm(emptyForm);
      return;
    }
    setForm({
      date: toDateInputValue(expense.date),
      productId: expense.productId ?? "",
      productName: expense.productName ?? "",
      price: expense.price != null ? String(expense.price) : "",
      litres: expense.litres != null ? String(expense.litres) : "",
    });
  }, [open, expense]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        expense
          ? API_ENDPOINTS.ADMIN_BUSINESS_EXPENSE(partnerId, expense._id)
          : API_ENDPOINTS.ADMIN_BUSINESS_EXPENSES(partnerId),
        {
          method: expense ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: form.date || null,
            productId: form.productId || null,
            productName: form.productName || null,
            price: parseOptionalNumber(form.price),
            litres: parseOptionalNumber(form.litres),
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || BUSINESS_COPY.createFailed);
        return;
      }
      toast.success(expense ? BUSINESS_COPY.updated : BUSINESS_COPY.created);
      onOpenChange(false);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? BUSINESS_COPY.editExpense : BUSINESS_COPY.addExpense}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <BusinessLineFields
          products={products}
          form={form}
          onChange={setForm}
          totalLabel={BUSINESS_COPY.totalCost}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {BUSINESS_COPY.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? BUSINESS_COPY.saving : BUSINESS_COPY.save}
          </Button>
        </div>
      </form>
    </AdminFormDialog>
  );
}
