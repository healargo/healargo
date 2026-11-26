"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import {
  AdminCard,
  AdminStatusPill,
} from "@/components/features/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { BUSINESS_COPY } from "@/constants/business";
import { ROUTES } from "@/constants/routes";
import { formatMoney } from "@/lib/business/format";
import { cn } from "@/lib/utils/cn";
import type { BusinessPartnerListItem } from "@/types/business";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PartnersTable({
  partners,
  onEdit,
  onDelete,
}: {
  partners: BusinessPartnerListItem[];
  onEdit: (partner: BusinessPartnerListItem) => void;
  onDelete: (partner: BusinessPartnerListItem) => void;
}) {
  return (
    <AdminCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-border bg-cream/60">
            <tr className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <th className="px-5 py-3.5 font-semibold">
                {BUSINESS_COPY.tablePartner}
              </th>
              <th className="px-5 py-3.5 font-semibold">
                {BUSINESS_COPY.tableOwner}
              </th>
              <th className="px-5 py-3.5 font-semibold">
                {BUSINESS_COPY.tableAccess}
              </th>
              <th className="px-5 py-3.5 font-semibold">
                {BUSINESS_COPY.cardExpenses}
              </th>
              <th className="px-5 py-3.5 font-semibold">
                {BUSINESS_COPY.cardSales}
              </th>
              <th className="px-5 py-3.5 font-semibold">
                {BUSINESS_COPY.cardCreditDue}
              </th>
              <th className="px-5 py-3.5 font-semibold">
                {BUSINESS_COPY.tableRecords}
              </th>
              <th className="px-5 py-3.5 font-semibold">
                {BUSINESS_COPY.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr
                key={partner._id}
                className="border-b border-border/70 transition hover:bg-cream/40"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-semibold",
                        partner.isOwner
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary-soft text-primary",
                      )}
                    >
                      {initials(partner.name) || "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-dark">
                        {partner.name}
                      </p>
                      {partner.summary.dueReminders > 0 ? (
                        <p className="text-xs text-warning">
                          {partner.summary.dueReminders}{" "}
                          {BUSINESS_COPY.cardReminders.toLowerCase()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted">
                  <p className="truncate">
                    {partner.owner?.name ?? partner.owner?.email ?? "—"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <AdminStatusPill
                    active={partner.isOwner}
                    label={
                      partner.isOwner
                        ? BUSINESS_COPY.youBadge
                        : BUSINESS_COPY.readOnlyBadge
                    }
                  />
                </td>
                <td className="px-5 py-4 font-medium text-dark">
                  {formatMoney(partner.summary.expensesTotal)}
                </td>
                <td className="px-5 py-4 font-medium text-dark">
                  {formatMoney(partner.summary.salesTotal)}
                </td>
                <td
                  className={cn(
                    "px-5 py-4 font-medium",
                    partner.summary.creditOutstanding > 0
                      ? "text-warning"
                      : "text-dark",
                  )}
                >
                  {formatMoney(partner.summary.creditOutstanding)}
                </td>
                <td className="px-5 py-4 text-muted">
                  {partner.summary.recordCount}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm">
                      <Link href={ROUTES.ADMIN.BUSINESS_PARTNER(partner._id)}>
                        {BUSINESS_COPY.openPartnerShort}
                      </Link>
                    </Button>
                    {partner.isOwner ? (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => onEdit(partner)}
                          aria-label={BUSINESS_COPY.editPartner}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => onDelete(partner)}
                          aria-label={BUSINESS_COPY.delete}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}
