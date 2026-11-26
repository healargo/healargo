import { CREDIT_STATUS } from "@/constants/business";
import { prisma } from "@/lib/db/prisma";
import {
  mapBusinessCredit,
  mapBusinessSale,
} from "@/lib/db/business";
import type { BusinessCredit, BusinessSale } from "@/types/business";

/**
 * Marks a credit collected (PAID) and creates a linked BusinessSale once.
 * Idempotent when convertedSaleId is already set.
 */
export async function collectCreditToSale(creditId: string, partnerId: string): Promise<{
  credit: BusinessCredit;
  sale: BusinessSale;
  createdSale: boolean;
}> {
  const existing = await prisma.businessCredit.findFirst({
    where: { id: creditId, partnerId },
  });
  if (!existing) {
    throw new Error("Credit not found");
  }

  if (existing.convertedSaleId) {
    const sale = await prisma.businessSale.findUnique({
      where: { id: existing.convertedSaleId },
    });
    if (!sale) {
      throw new Error("Linked sale missing");
    }
    const credit =
      existing.status === CREDIT_STATUS.PAID
        ? existing
        : await prisma.businessCredit.update({
            where: { id: creditId },
            data: {
              status: CREDIT_STATUS.PAID,
              amountPaid: existing.totalPrice ?? existing.amountPaid,
              collectedAt: existing.collectedAt ?? new Date(),
            },
          });
    return {
      credit: mapBusinessCredit(credit),
      sale: mapBusinessSale(sale),
      createdSale: false,
    };
  }

  const collectedAt = new Date();
  const saleDate = existing.expectedCollectionDate ?? collectedAt;
  const amountPaid = existing.totalPrice ?? existing.amountPaid;

  const result = await prisma.$transaction(async (tx) => {
    const sale = await tx.businessSale.create({
      data: {
        partnerId,
        date: saleDate,
        productId: existing.productId,
        productName: existing.productName,
        price: existing.price,
        litres: existing.litres,
        totalAmount: existing.totalPrice,
      },
    });

    const credit = await tx.businessCredit.update({
      where: { id: creditId },
      data: {
        status: CREDIT_STATUS.PAID,
        amountPaid: amountPaid ?? 0,
        collectedAt,
        convertedSaleId: sale.id,
      },
    });

    return { credit, sale };
  });

  return {
    credit: mapBusinessCredit(result.credit),
    sale: mapBusinessSale(result.sale),
    createdSale: true,
  };
}
