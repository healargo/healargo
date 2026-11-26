import { NextResponse } from "next/server";
import { BUSINESS_COPY, CREDIT_STATUS } from "@/constants/business";
import { requireAdmin } from "@/lib/auth/require-admin";
import { collectCreditToSale } from "@/lib/business/collect-credit";
import { requirePartnerOwner } from "@/lib/business/partner-auth";
import { creditCollectSchema } from "@/lib/business/schemas";
import { mapBusinessCredit } from "@/lib/db/business";
import { isDbId } from "@/lib/db/serialize";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ partnerId: string; id: string }> };

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { partnerId, id } = await params;
  if (!isDbId(partnerId) || !isDbId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const ownership = await requirePartnerOwner(partnerId, admin.session.user.id);
  if (!ownership.ok) return ownership.response;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = creditCollectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    if (!parsed.data.collected) {
      const existing = await prisma.businessCredit.findFirst({
        where: { id, partnerId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Credit not found" }, { status: 404 });
      }
      if (existing.convertedSaleId) {
        return NextResponse.json(
          { error: BUSINESS_COPY.alreadyCollected },
          { status: 409 },
        );
      }
      const updated = await prisma.businessCredit.update({
        where: { id },
        data: {
          status:
            existing.status === CREDIT_STATUS.PAID
              ? CREDIT_STATUS.UNPAID
              : existing.status,
          collectedAt: null,
        },
      });
      return NextResponse.json({
        data: { credit: mapBusinessCredit(updated), sale: null },
        message: BUSINESS_COPY.updated,
      });
    }

    const result = await collectCreditToSale(id, partnerId);
    return NextResponse.json({
      data: { credit: result.credit, sale: result.sale },
      message: result.createdSale
        ? BUSINESS_COPY.collectedMovedToSales
        : BUSINESS_COPY.alreadyCollected,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : BUSINESS_COPY.collectFailed;
    const status = message === "Credit not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
