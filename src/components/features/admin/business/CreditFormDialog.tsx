"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditFormFields,
  type CreditFormState,
} from "@/components/features/admin/business/CreditFormFields";
import { AdminFormDialog } from "@/components/features/admin/AdminFormDialog";
import { Button } from "@/components/ui/button";
import { BUSINESS_COPY, CREDIT_STATUS } from "@/constants/business";
import { API_ENDPOINTS } from "@/constants/api";
import {
  parseOptionalNumber,
  previewTotal,
  toDateInputValue,
} from "@/lib/business/format";
import { deriveCreditStatus } from "@/lib/business/totals";
import type { BusinessCredit, BusinessProductOption } from "@/types/business";

const emptyForm: CreditFormState = {
  date: "",
  shopName: "",
  productId: "",
  productName: "",
  price: "",
  litres: "",
  amountPaid: "",
  expectedCollectionDate: "",
  status: CREDIT_STATUS.UNPAID,
};

export function CreditFormDialog({
  open,
  onOpenChange,
  partnerId,
  products,
  credit,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  products: BusinessProductOption[];
  credit?: BusinessCredit | null;
  onDone: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!credit) {
      setForm(emptyForm);
      return;
    }
    setForm({
      date: toDateInputValue(credit.date),
      shopName: credit.shopName ?? "",
      productId: credit.productId ?? "",
      productName: credit.productName ?? "",
      price: credit.price != null ? String(credit.price) : "",
      litres: credit.litres != null ? String(credit.litres) : "",
      amountPaid: credit.amountPaid != null ? String(credit.amountPaid) : "",
      expectedCollectionDate: toDateInputValue(credit.expectedCollectionDate),
      status: credit.status,
    });
  }, [open, credit]);

  const total = previewTotal(form.price, form.litres);
  const paid = parseOptionalNumber(form.amountPaid) ?? 0;
  const remaining =
    total == null ? null : Math.max(0, Math.round((total - paid) * 100) / 100);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const amountPaid = parseOptionalNumber(form.amountPaid) ?? 0;
      const totalPrice = previewTotal(form.price, form.litres);
      const status = deriveCreditStatus(totalPrice, amountPaid);
      const res = await fetch(
        credit
          ? API_ENDPOINTS.ADMIN_BUSINESS_CREDIT(partnerId, credit._id)
          : API_ENDPOINTS.ADMIN_BUSINESS_CREDITS(partnerId),
        {
          method: credit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: form.date || null,
            shopName: form.shopName || null,
            productId: form.productId || null,
            productName: form.productName || null,
            price: parseOptionalNumber(form.price),
            litres: parseOptionalNumber(form.litres),
            amountPaid,
            expectedCollectionDate: form.expectedCollectionDate || null,
            status,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || BUSINESS_COPY.createFailed);
        return;
      }
      toast.success(json.message || (credit ? BUSINESS_COPY.updated : BUSINESS_COPY.created));
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
      title={credit ? BUSINESS_COPY.editCredit : BUSINESS_COPY.addCredit}
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <CreditFormFields
          products={products}
          form={form}
          onChange={(next) => setForm((f) => ({ ...f, ...next }))}
          total={total}
          paid={paid}
          remaining={remaining}
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
