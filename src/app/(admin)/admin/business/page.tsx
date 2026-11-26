import { AdminBusinessPartnersClient } from "@/components/features/admin/business/AdminBusinessPartnersClient";
import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth/auth";
import { mapBusinessPartners } from "@/lib/db/business";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import type { BusinessPartnerListItem } from "@/types/business";

export const dynamic = "force-dynamic";

export default async function AdminBusinessPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.LOGIN);

  const partners = await prisma.businessPartner.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      expenses: { select: { totalCost: true } },
      sales: { select: { totalAmount: true } },
      credits: {
        select: {
          totalPrice: true,
          amountPaid: true,
          expectedCollectionDate: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped: BusinessPartnerListItem[] = mapBusinessPartners(
    partners,
    session.user.id,
  ).map((partner, index) => {
    const row = partners[index];
    const expensesTotal = row.expenses.reduce(
      (sum, item) => sum + (item.totalCost ?? 0),
      0,
    );
    const salesTotal = row.sales.reduce(
      (sum, item) => sum + (item.totalAmount ?? 0),
      0,
    );
    const creditOutstanding = row.credits.reduce((sum, item) => {
      return sum + Math.max(0, (item.totalPrice ?? 0) - (item.amountPaid ?? 0));
    }, 0);
    const dueReminders = row.credits.filter(
      (item) =>
        item.expectedCollectionDate &&
        item.status !== "PAID" &&
        !Number.isNaN(item.expectedCollectionDate.getTime()),
    ).length;

    return {
      ...partner,
      summary: {
        expensesTotal,
        salesTotal,
        creditOutstanding,
        dueReminders,
        recordCount:
          row.expenses.length + row.sales.length + row.credits.length,
      },
    };
  });

  return <AdminBusinessPartnersClient partners={mapped} />;
}
