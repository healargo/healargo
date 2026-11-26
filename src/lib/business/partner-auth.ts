import { NextResponse } from "next/server";
import { BUSINESS_COPY } from "@/constants/business";
import { prisma } from "@/lib/db/prisma";

export async function getPartnerOr404(partnerId: string) {
  const partner = await prisma.businessPartner.findUnique({
    where: { id: partnerId },
  });
  if (!partner) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Partner not found" }, { status: 404 }),
    };
  }
  return { ok: true as const, partner };
}

export async function requirePartnerOwner(partnerId: string, userId: string) {
  const result = await getPartnerOr404(partnerId);
  if (!result.ok) return result;

  if (result.partner.userId !== userId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: BUSINESS_COPY.forbidden },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, partner: result.partner };
}
