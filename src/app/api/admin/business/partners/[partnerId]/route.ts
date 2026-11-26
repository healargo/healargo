import { NextResponse } from "next/server";
import { BUSINESS_COPY } from "@/constants/business";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requirePartnerOwner } from "@/lib/business/partner-auth";
import { partnerUpdateSchema } from "@/lib/business/schemas";
import { mapBusinessPartner } from "@/lib/db/business";
import { isDbId } from "@/lib/db/serialize";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ partnerId: string }> };

export async function PATCH(request: Request, { params }: Params) {
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
    const parsed = partnerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid partner data" },
        { status: 400 },
      );
    }

    const updated = await prisma.businessPartner.update({
      where: { id: partnerId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      data: mapBusinessPartner(updated, admin.session.user.id),
      message: BUSINESS_COPY.partnerUpdated,
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

  const { partnerId } = await params;
  if (!isDbId(partnerId)) {
    return NextResponse.json({ error: "Invalid partner id" }, { status: 400 });
  }

  const ownership = await requirePartnerOwner(partnerId, admin.session.user.id);
  if (!ownership.ok) return ownership.response;

  try {
    await prisma.businessPartner.delete({ where: { id: partnerId } });
    return NextResponse.json({ message: BUSINESS_COPY.partnerDeleted });
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
