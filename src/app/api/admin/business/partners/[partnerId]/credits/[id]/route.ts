import { NextResponse } from "next/server";
import { BUSINESS_COPY, CREDIT_STATUS } from "@/constants/business";
import { requireAdmin } from "@/lib/auth/require-admin";
import { collectCreditToSale } from "@/lib/business/collect-credit";
import { requirePartnerOwner } from "@/lib/business/partner-auth";
import { creditUpsertSchema } from "@/lib/business/schemas";
import {
  computeLineTotal,
  deriveCreditStatus,
  mapBusinessCredit,
} from "@/lib/db/business";
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
    const existing = await prisma.businessCredit.findFirst({
      where: { id, partnerId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = creditUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid credit data" },
        { status: 400 },
      );
    }

    const {
      date,
      shopName,
      productId,
      productName,
      price,
      litres,
      amountPaid,
      expectedCollectionDate,
      status,
    } = parsed.data;
    const totalPrice = computeLineTotal(price, litres);
    const paid = amountPaid ?? 0;
    const resolvedStatus = status ?? deriveCreditStatus(totalPrice, paid);

    const updated = await prisma.businessCredit.update({
      where: { id },
      data: {
        date,
        shopName,
        productId,
        productName,
        price,
        litres,
        totalPrice,
        amountPaid: paid,
        expectedCollectionDate,
        status: resolvedStatus,
      },
    });

    if (resolvedStatus === CREDIT_STATUS.PAID && !updated.convertedSaleId) {
      const collected = await collectCreditToSale(id, partnerId);
      return NextResponse.json({
        data: collected.credit,
        message: collected.createdSale
          ? BUSINESS_COPY.collectedMovedToSales
          : BUSINESS_COPY.updated,
      });
    }

    return NextResponse.json({
      data: mapBusinessCredit(updated),
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
    const existing = await prisma.businessCredit.findFirst({
      where: { id, partnerId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    await prisma.businessCredit.delete({ where: { id } });
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
