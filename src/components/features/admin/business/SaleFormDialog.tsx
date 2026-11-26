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
import type { BusinessProductOption, BusinessSale } from "@/types/business";

const emptyForm: BusinessLineFormState = {
  date: "",
  productId: "",
  productName: "",
  price: "",
  litres: "",
};

export function SaleFormDialog({
  open,
  onOpenChange,
  partnerId,
  products,
  sale,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  products: BusinessProductOption[];
  sale?: BusinessSale | null;
  onDone: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!sale) {
      setForm(emptyForm);
      return;
    }
    setForm({
      date: toDateInputValue(sale.date),
      productId: sale.productId ?? "",
      productName: sale.productName ?? "",
      price: sale.price != null ? String(sale.price) : "",
      litres: sale.litres != null ? String(sale.litres) : "",
    });
  }, [open, sale]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        sale
          ? API_ENDPOINTS.ADMIN_BUSINESS_SALE(partnerId, sale._id)
          : API_ENDPOINTS.ADMIN_BUSINESS_SALES(partnerId),
        {
          method: sale ? "PATCH" : "POST",
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
      toast.success(sale ? BUSINESS_COPY.updated : BUSINESS_COPY.created);
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
      title={sale ? BUSINESS_COPY.editSale : BUSINESS_COPY.addSale}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <BusinessLineFields
          products={products}
          form={form}
          onChange={setForm}
          totalLabel={BUSINESS_COPY.totalAmount}
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
