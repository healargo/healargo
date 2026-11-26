"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, IndianRupee, Receipt, Store, Wallet } from "lucide-react";
import { CreditsTab } from "@/components/features/admin/business/CreditsTab";
import { ExpensesTab } from "@/components/features/admin/business/ExpensesTab";
import { RemindersTab } from "@/components/features/admin/business/RemindersTab";
import { SalesTab } from "@/components/features/admin/business/SalesTab";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusPill,
} from "@/components/features/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { BUSINESS_COPY } from "@/constants/business";
import { ROUTES } from "@/constants/routes";
import { formatMoney } from "@/lib/business/format";
import { cn } from "@/lib/utils/cn";
import type {
  BusinessCredit,
  BusinessExpense,
  BusinessPartner,
  BusinessPartnerStats,
  BusinessProductOption,
  BusinessSale,
} from "@/types/business";

const TABS = [
  { id: "expenses", label: BUSINESS_COPY.expensesTab },
  { id: "credit", label: BUSINESS_COPY.creditTab },
  { id: "reminders", label: BUSINESS_COPY.remindersTab },
  { id: "sales", label: BUSINESS_COPY.salesTab },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminPartnerDetailClient({
  partner,
  expenses,
  credits,
  sales,
  products,
  stats,
}: {
  partner: BusinessPartner;
  expenses: BusinessExpense[];
  credits: BusinessCredit[];
  sales: BusinessSale[];
  products: BusinessProductOption[];
  stats: BusinessPartnerStats;
}) {
  const [tab, setTab] = useState<TabId>("expenses");

  const content = useMemo(() => {
    if (tab === "credit") {
      return (
        <CreditsTab
          partnerId={partner._id}
          isOwner={partner.isOwner}
          credits={credits}
          products={products}
        />
      );
    }
    if (tab === "reminders") {
      return (
        <RemindersTab
          partnerId={partner._id}
          isOwner={partner.isOwner}
          credits={credits}
        />
      );
    }
    if (tab === "sales") {
      return (
        <SalesTab
          partnerId={partner._id}
          isOwner={partner.isOwner}
          sales={sales}
          products={products}
        />
      );
    }
    return (
      <ExpensesTab
        partnerId={partner._id}
        isOwner={partner.isOwner}
        expenses={expenses}
        products={products}
      />
    );
  }, [tab, partner, expenses, credits, sales, products]);

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.ADMIN.BUSINESS}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {BUSINESS_COPY.backToPartners}
          </Link>
        </Button>
      </div>

      <AdminPageHeader
        title={partner.name}
        description={BUSINESS_COPY.detailTitle}
        actions={
          <AdminStatusPill
            active={partner.isOwner}
            label={
              partner.isOwner
                ? BUSINESS_COPY.youBadge
                : BUSINESS_COPY.readOnlyBadge
            }
          />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={BUSINESS_COPY.statsExpenses}
          value={formatMoney(stats.expensesTotal)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <AdminStatCard
          label={BUSINESS_COPY.statsSales}
          value={formatMoney(stats.salesTotal)}
          icon={<IndianRupee className="h-5 w-5" />}
          tone="accent"
        />
        <AdminStatCard
          label={BUSINESS_COPY.statsCreditOutstanding}
          value={formatMoney(stats.creditOutstanding)}
          icon={<Receipt className="h-5 w-5" />}
          tone="dark"
        />
        <AdminStatCard
          label={BUSINESS_COPY.statsCreditPaid}
          value={formatMoney(stats.creditCollected)}
          icon={<Store className="h-5 w-5" />}
          tone="muted"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-border/70 pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              tab === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-cream text-muted hover:bg-cream/80 hover:text-dark",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {content}
    </div>
  );
}
