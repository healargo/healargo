"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BusinessEntriesTable,
  dateCell,
  moneyCell,
} from "@/components/features/admin/business/BusinessEntriesTable";
import { CreditFormDialog } from "@/components/features/admin/business/CreditFormDialog";
import {
  AdminAddButton,
  AdminCard,
  AdminStatusPill,
} from "@/components/features/admin/AdminUi";
import {
  BUSINESS_COPY,
  CREDIT_STATUS,
  CREDIT_STATUS_OPTIONS,
} from "@/constants/business";
import { API_ENDPOINTS } from "@/constants/api";
import type { BusinessCredit, BusinessProductOption } from "@/types/business";

function statusLabel(status: string): string {
  return (
    CREDIT_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

export function CreditsTab({
  partnerId,
  isOwner,
  credits,
  products,
}: {
  partnerId: string;
  isOwner: boolean;
  credits: BusinessCredit[];
  products: BusinessProductOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessCredit | null>(null);

  const rows = useMemo(
    () =>
      credits.map((item) => {
        const remaining =
          item.totalPrice == null
            ? null
            : Math.max(0, item.totalPrice - item.amountPaid);
        return {
          id: item._id,
          cells: [
            dateCell(item.date),
            item.shopName,
            item.productName,
            moneyCell(item.price),
            item.litres != null ? String(item.litres) : null,
            moneyCell(item.totalPrice),
            moneyCell(item.amountPaid),
            moneyCell(remaining),
            dateCell(item.expectedCollectionDate),
            statusLabel(item.status),
          ],
        };
      }),
    [credits],
  );

  async function onDelete(id: string) {
    if (!window.confirm(BUSINESS_COPY.confirmDelete)) return;
    const res = await fetch(
      API_ENDPOINTS.ADMIN_BUSINESS_CREDIT(partnerId, id),
      { method: "DELETE" },
    );
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || BUSINESS_COPY.deleteFailed);
      return;
    }
    toast.success(BUSINESS_COPY.deleted);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AdminStatusPill
          active={credits.some((c) => c.status !== CREDIT_STATUS.PAID)}
          label={`${credits.filter((c) => c.status !== CREDIT_STATUS.PAID).length} open`}
        />
        {isOwner ? (
          <AdminAddButton
            label={BUSINESS_COPY.addCredit}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        ) : null}
      </div>
      <AdminCard>
        <BusinessEntriesTable
          headers={[
            BUSINESS_COPY.date,
            BUSINESS_COPY.shopName,
            BUSINESS_COPY.product,
            BUSINESS_COPY.price,
            BUSINESS_COPY.litres,
            BUSINESS_COPY.totalPrice,
            BUSINESS_COPY.amountPaid,
            BUSINESS_COPY.remaining,
            BUSINESS_COPY.collectOn,
            BUSINESS_COPY.status,
          ]}
          rows={rows}
          empty={BUSINESS_COPY.emptyCredits}
          isOwner={isOwner}
          onEdit={(id) => {
            setEditing(credits.find((item) => item._id === id) ?? null);
            setOpen(true);
          }}
          onDelete={onDelete}
        />
      </AdminCard>
      {isOwner ? (
        <CreditFormDialog
          open={open}
          onOpenChange={setOpen}
          partnerId={partnerId}
          products={products}
          credit={editing}
          onDone={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
