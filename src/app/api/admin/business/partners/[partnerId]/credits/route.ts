import { NextResponse } from "next/server";
import { BUSINESS_COPY, CREDIT_STATUS } from "@/constants/business";
import { requireAdmin } from "@/lib/auth/require-admin";
import { collectCreditToSale } from "@/lib/business/collect-credit";
import {
  getPartnerOr404,
  requirePartnerOwner,
} from "@/lib/business/partner-auth";
import { creditUpsertSchema } from "@/lib/business/schemas";
import {
  computeLineTotal,
  deriveCreditStatus,
  mapBusinessCredit,
  mapBusinessCredits,
} from "@/lib/db/business";
import { isDbId } from "@/lib/db/serialize";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ partnerId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { partnerId } = await params;
  if (!isDbId(partnerId)) {
    return NextResponse.json({ error: "Invalid partner id" }, { status: 400 });
  }

  const partner = await getPartnerOr404(partnerId);
  if (!partner.ok) return partner.response;

  try {
    const credits = await prisma.businessCredit.findMany({
      where: { partnerId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ data: mapBusinessCredits(credits) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch credits",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { partnerId } = await params;
  if (!isDbId(partnerId)) {
    return NextResponse.json({ error: "Invalid partner id" }, { status: 400 });
  }

  const ownership = await requirePartnerOwner(partnerId, admin.session.user.id);
  if (!ownership.ok) return ownership.response;

  try {
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

    const created = await prisma.businessCredit.create({
      data: {
        partnerId,
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

    if (resolvedStatus === CREDIT_STATUS.PAID) {
      const collected = await collectCreditToSale(created.id, partnerId);
      return NextResponse.json(
        {
          data: collected.credit,
          message: collected.createdSale
            ? BUSINESS_COPY.collectedMovedToSales
            : BUSINESS_COPY.created,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { data: mapBusinessCredit(created), message: BUSINESS_COPY.created },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : BUSINESS_COPY.createFailed,
      },
      { status: 500 },
    );
  }
}
