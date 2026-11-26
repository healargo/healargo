"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminCard,
  AdminStatusPill,
} from "@/components/features/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { BUSINESS_COPY, CREDIT_STATUS } from "@/constants/business";
import { API_ENDPOINTS } from "@/constants/api";
import {
  formatBusinessDate,
  formatMoney,
} from "@/lib/business/format";
import {
  reminderCredits,
  reminderDueTone,
  type ReminderDueTone,
} from "@/lib/business/reminders";
import { cn } from "@/lib/utils/cn";
import type { BusinessCredit } from "@/types/business";

const TONE_LABEL: Record<ReminderDueTone, string> = {
  overdue: BUSINESS_COPY.overdue,
  today: BUSINESS_COPY.dueToday,
  upcoming: BUSINESS_COPY.upcoming,
  collected: BUSINESS_COPY.collected,
};

export function RemindersTab({
  partnerId,
  isOwner,
  credits,
}: {
  partnerId: string;
  isOwner: boolean;
  credits: BusinessCredit[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const rows = useMemo(() => reminderCredits(credits), [credits]);
  const openCount = rows.filter((c) => !c.convertedSaleId).length;

  async function onCollect(credit: BusinessCredit, collected: boolean) {
    setBusyId(credit._id);
    try {
      const res = await fetch(
        API_ENDPOINTS.ADMIN_BUSINESS_CREDIT_COLLECT(partnerId, credit._id),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collected }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || BUSINESS_COPY.collectFailed);
        return;
      }
      toast.success(json.message || BUSINESS_COPY.updated);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <AdminCard>
        <p className="px-5 py-10 text-center text-sm text-muted">
          {BUSINESS_COPY.emptyReminders}
        </p>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-4">
      <AdminStatusPill
        active={openCount > 0}
        label={`${openCount} ${BUSINESS_COPY.remaining.toLowerCase()}`}
      />
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border/80 bg-cream/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {BUSINESS_COPY.collectOn}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {BUSINESS_COPY.shopName}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {BUSINESS_COPY.product}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {BUSINESS_COPY.remaining}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {BUSINESS_COPY.status}
                </th>
                {isOwner ? (
                  <th className="px-4 py-3 font-semibold">
                    {BUSINESS_COPY.actions}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((credit) => {
                const tone = reminderDueTone(credit);
                const remaining =
                  credit.totalPrice == null
                    ? null
                    : Math.max(0, credit.totalPrice - credit.amountPaid);
                const isCollected = Boolean(credit.convertedSaleId);
                return (
                  <tr
                    key={credit._id}
                    className={cn(
                      "border-b border-border/60 last:border-0",
                      tone === "overdue" && "bg-destructive/5",
                      tone === "today" && "bg-warning-soft/40",
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-dark">
                      {formatBusinessDate(credit.expectedCollectionDate)}
                      <span
                        className={cn(
                          "ml-2 text-xs font-semibold",
                          tone === "overdue" && "text-destructive",
                          tone === "today" && "text-warning",
                          tone === "upcoming" && "text-muted",
                          tone === "collected" && "text-success",
                        )}
                      >
                        {TONE_LABEL[tone]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark">
                      {credit.shopName || "—"}
                    </td>
                    <td className="px-4 py-3 text-dark">
                      {credit.productName || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-dark">
                      {formatMoney(
                        isCollected ? credit.totalPrice : remaining,
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark">
                      {isCollected
                        ? BUSINESS_COPY.collected
                        : credit.status === CREDIT_STATUS.PAID
                          ? BUSINESS_COPY.collected
                          : TONE_LABEL[tone]}
                    </td>
                    {isOwner ? (
                      <td className="px-4 py-3">
                        {isCollected ? (
                          <span className="text-xs text-success">
                            {BUSINESS_COPY.alreadyCollected}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            disabled={busyId === credit._id}
                            onClick={() => onCollect(credit, true)}
                          >
                            {busyId === credit._id
                              ? BUSINESS_COPY.saving
                              : BUSINESS_COPY.markCollected}
                          </Button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
