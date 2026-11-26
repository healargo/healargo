"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BusinessEntriesTable,
  dateCell,
  moneyCell,
} from "@/components/features/admin/business/BusinessEntriesTable";
import { ExpenseFormDialog } from "@/components/features/admin/business/ExpenseFormDialog";
import {
  AdminAddButton,
  AdminCard,
} from "@/components/features/admin/AdminUi";
import { BUSINESS_COPY } from "@/constants/business";
import { API_ENDPOINTS } from "@/constants/api";
import type { BusinessExpense, BusinessProductOption } from "@/types/business";

export function ExpensesTab({
  partnerId,
  isOwner,
  expenses,
  products,
}: {
  partnerId: string;
  isOwner: boolean;
  expenses: BusinessExpense[];
  products: BusinessProductOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessExpense | null>(null);

  const rows = useMemo(
    () =>
      expenses.map((item) => ({
        id: item._id,
        cells: [
          dateCell(item.date),
          item.productName,
          moneyCell(item.price),
          item.litres != null ? String(item.litres) : null,
          moneyCell(item.totalCost),
        ],
      })),
    [expenses],
  );

  async function onDelete(id: string) {
    if (!window.confirm(BUSINESS_COPY.confirmDelete)) return;
    const res = await fetch(
      API_ENDPOINTS.ADMIN_BUSINESS_EXPENSE(partnerId, id),
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
            label={BUSINESS_COPY.addExpense}
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
            BUSINESS_COPY.totalCost,
          ]}
          rows={rows}
          empty={BUSINESS_COPY.emptyExpenses}
          isOwner={isOwner}
          onEdit={(id) => {
            setEditing(expenses.find((item) => item._id === id) ?? null);
            setOpen(true);
          }}
          onDelete={onDelete}
        />
      </AdminCard>
      {isOwner ? (
        <ExpenseFormDialog
          open={open}
          onOpenChange={setOpen}
          partnerId={partnerId}
          products={products}
          expense={editing}
          onDone={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
