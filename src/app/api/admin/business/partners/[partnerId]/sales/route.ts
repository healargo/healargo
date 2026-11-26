import { NextResponse } from "next/server";
import { BUSINESS_COPY } from "@/constants/business";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getPartnerOr404,
  requirePartnerOwner,
} from "@/lib/business/partner-auth";
import { saleUpsertSchema } from "@/lib/business/schemas";
import {
  computeLineTotal,
  mapBusinessSale,
  mapBusinessSales,
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
    const sales = await prisma.businessSale.findMany({
      where: { partnerId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ data: mapBusinessSales(sales) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch sales",
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
    const parsed = saleUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid sale data" },
        { status: 400 },
      );
    }

    const { date, productId, productName, price, litres } = parsed.data;
    const created = await prisma.businessSale.create({
      data: {
        partnerId,
        date,
        productId,
        productName,
        price,
        litres,
        totalAmount: computeLineTotal(price, litres),
      },
    });

    return NextResponse.json(
      { data: mapBusinessSale(created), message: BUSINESS_COPY.created },
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
