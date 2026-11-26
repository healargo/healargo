"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_COPY } from "@/constants/business";
import {
  formatBusinessDate,
  formatMoney,
} from "@/lib/business/format";
import { cn } from "@/lib/utils/cn";

export interface BusinessTableRow {
  id: string;
  cells: Array<string | null | undefined>;
}

export function BusinessEntriesTable({
  headers,
  rows,
  empty,
  isOwner,
  onEdit,
  onDelete,
}: {
  headers: string[];
  rows: BusinessTableRow[];
  empty: string;
  isOwner: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted">{empty}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border/80 bg-cream/40 text-xs uppercase tracking-wide text-muted">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
            {isOwner ? (
              <th className="px-4 py-3 font-semibold">{BUSINESS_COPY.actions}</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/60 last:border-0"
            >
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.id}-${index}`}
                  className={cn(
                    "px-4 py-3 text-dark",
                    index === row.cells.length - 1 && "font-semibold",
                  )}
                >
                  {cell || "—"}
                </td>
              ))}
              {isOwner ? (
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(row.id)}
                      aria-label={BUSINESS_COPY.editExpense}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(row.id)}
                      aria-label={BUSINESS_COPY.delete}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function moneyCell(value: number | null | undefined): string {
  return formatMoney(value);
}

export function dateCell(value: string | null | undefined): string {
  return formatBusinessDate(value);
}
