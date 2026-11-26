import { NextResponse } from "next/server";
import { BUSINESS_COPY } from "@/constants/business";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requirePartnerOwner } from "@/lib/business/partner-auth";
import { expenseUpsertSchema } from "@/lib/business/schemas";
import { computeLineTotal, mapBusinessExpense } from "@/lib/db/business";
import { isDbId } from "@/lib/db/serialize";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ partnerId: string; id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { partnerId, id } = await params;
  if (!isDbId(partnerId) || !isDbId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ownership = await requirePartnerOwner(partnerId, admin.session.user.id);
  if (!ownership.ok) return ownership.response;

  try {
    const existing = await prisma.businessExpense.findFirst({
      where: { id, partnerId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = expenseUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid expense data" },
        { status: 400 },
      );
    }

    const { date, productId, productName, price, litres } = parsed.data;
    const updated = await prisma.businessExpense.update({
      where: { id },
      data: {
        date,
        productId,
        productName,
        price,
        litres,
        totalCost: computeLineTotal(price, litres),
      },
    });

    return NextResponse.json({
      data: mapBusinessExpense(updated),
      message: BUSINESS_COPY.updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : BUSINESS_COPY.updateFailed,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { partnerId, id } = await params;
  if (!isDbId(partnerId) || !isDbId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ownership = await requirePartnerOwner(partnerId, admin.session.user.id);
  if (!ownership.ok) return ownership.response;

  try {
    const existing = await prisma.businessExpense.findFirst({
      where: { id, partnerId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.businessExpense.delete({ where: { id } });
    return NextResponse.json({ message: BUSINESS_COPY.deleted });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : BUSINESS_COPY.deleteFailed,
      },
      { status: 500 },
    );
  }
}
