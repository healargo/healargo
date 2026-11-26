import { notFound, redirect } from "next/navigation";
import { AdminPartnerDetailClient } from "@/components/features/admin/business/AdminPartnerDetailClient";
import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth/auth";
import {
  mapBusinessCredits,
  mapBusinessExpenses,
  mapBusinessPartner,
  mapBusinessSales,
} from "@/lib/db/business";
import { isDbId } from "@/lib/db/serialize";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ partnerId: string }> };

export default async function AdminBusinessPartnerPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.LOGIN);

  const { partnerId } = await params;
  if (!isDbId(partnerId)) notFound();

  const partner = await prisma.businessPartner.findUnique({
    where: { id: partnerId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!partner) notFound();

  const [expenses, credits, sales, products] = await Promise.all([
    prisma.businessExpense.findMany({
      where: { partnerId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.businessCredit.findMany({
      where: { partnerId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.businessSale.findMany({
      where: { partnerId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const mappedExpenses = mapBusinessExpenses(expenses);
  const mappedCredits = mapBusinessCredits(credits);
  const mappedSales = mapBusinessSales(sales);

  const expensesTotal = mappedExpenses.reduce(
    (sum, item) => sum + (item.totalCost ?? 0),
    0,
  );
  const salesTotal = mappedSales.reduce(
    (sum, item) => sum + (item.totalAmount ?? 0),
    0,
  );
  const creditCollected = mappedCredits.reduce(
    (sum, item) => sum + (item.amountPaid ?? 0),
    0,
  );
  const creditOutstanding = mappedCredits.reduce((sum, item) => {
    const remaining = Math.max(0, (item.totalPrice ?? 0) - (item.amountPaid ?? 0));
    return sum + remaining;
  }, 0);

  return (
    <AdminPartnerDetailClient
      partner={mapBusinessPartner(partner, session.user.id)}
      expenses={mappedExpenses}
      credits={mappedCredits}
      sales={mappedSales}
      products={products.map((product) => ({
        _id: product.id,
        name: product.name,
      }))}
      stats={{
        expensesTotal,
        salesTotal,
        creditOutstanding,
        creditCollected,
      }}
    />
  );
}
