import { NextResponse } from "next/server";
import { BUSINESS_COPY } from "@/constants/business";
import { requireAdmin } from "@/lib/auth/require-admin";
import { partnerCreateSchema } from "@/lib/business/schemas";
import { mapBusinessPartner, mapBusinessPartners } from "@/lib/db/business";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const partners = await prisma.businessPartner.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: mapBusinessPartners(partners, admin.session.user.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch partners",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const parsed = partnerCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid partner data" },
        { status: 400 },
      );
    }

    const created = await prisma.businessPartner.create({
      data: {
        name: parsed.data.name,
        userId: admin.session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        data: mapBusinessPartner(created, admin.session.user.id),
        message: BUSINESS_COPY.partnerCreated,
      },
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
