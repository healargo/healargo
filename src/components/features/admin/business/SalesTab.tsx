"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BusinessEntriesTable,
  dateCell,
  moneyCell,
} from "@/components/features/admin/business/BusinessEntriesTable";
import { SaleFormDialog } from "@/components/features/admin/business/SaleFormDialog";
import {
  AdminAddButton,
  AdminCard,
} from "@/components/features/admin/AdminUi";
import { BUSINESS_COPY } from "@/constants/business";
import { API_ENDPOINTS } from "@/constants/api";
import type { BusinessProductOption, BusinessSale } from "@/types/business";

export function SalesTab({
  partnerId,
  isOwner,
  sales,
  products,
}: {
  partnerId: string;
  isOwner: boolean;
  sales: BusinessSale[];
  products: BusinessProductOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessSale | null>(null);

  const rows = useMemo(
    () =>
      sales.map((item) => ({
        id: item._id,
        cells: [
          dateCell(item.date),
          item.productName,
          moneyCell(item.price),
          item.litres != null ? String(item.litres) : null,
          moneyCell(item.totalAmount),
        ],
      })),
    [sales],
  );

  async function onDelete(id: string) {
    if (!window.confirm(BUSINESS_COPY.confirmDelete)) return;
    const res = await fetch(
      API_ENDPOINTS.ADMIN_BUSINESS_SALE(partnerId, id),
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
      {isOwner ? (
        <div className="flex justify-end">
          <AdminAddButton
            label={BUSINESS_COPY.addSale}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        </div>
      ) : null}
      <AdminCard>
        <BusinessEntriesTable
          headers={[
            BUSINESS_COPY.date,
            BUSINESS_COPY.product,
            BUSINESS_COPY.price,
            BUSINESS_COPY.litres,
            BUSINESS_COPY.totalAmount,
          ]}
          rows={rows}
          empty={BUSINESS_COPY.emptySales}
          isOwner={isOwner}
          onEdit={(id) => {
            setEditing(sales.find((item) => item._id === id) ?? null);
            setOpen(true);
          }}
          onDelete={onDelete}
        />
      </AdminCard>
      {isOwner ? (
        <SaleFormDialog
          open={open}
          onOpenChange={setOpen}
          partnerId={partnerId}
          products={products}
          sale={editing}
          onDone={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
