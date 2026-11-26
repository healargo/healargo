import type {
  BusinessCredit as PrismaCredit,
  BusinessExpense as PrismaExpense,
  BusinessPartner as PrismaPartner,
  BusinessSale as PrismaSale,
  User,
} from "@prisma/client";
import { withId } from "@/lib/db/serialize";
import type {
  BusinessCredit,
  BusinessExpense,
  BusinessPartner,
  BusinessSale,
} from "@/types/business";

export {
  computeLineTotal,
  deriveCreditStatus,
} from "@/lib/business/totals";

type PartnerWithUser = PrismaPartner & {
  user?: Pick<User, "id" | "name" | "email"> | null;
};

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function mapBusinessPartner(
  row: PartnerWithUser,
  currentUserId: string,
): BusinessPartner {
  const base = withId(row);
  return {
    _id: base._id,
    id: row.id,
    name: row.name,
    userId: row.userId,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isOwner: row.userId === currentUserId,
    owner: row.user
      ? {
          _id: row.user.id,
          name: row.user.name,
          email: row.user.email,
        }
      : undefined,
  };
}

export function mapBusinessPartners(
  rows: PartnerWithUser[],
  currentUserId: string,
): BusinessPartner[] {
  return rows.map((row) => mapBusinessPartner(row, currentUserId));
}

export function mapBusinessExpense(row: PrismaExpense): BusinessExpense {
  const base = withId(row);
  return {
    _id: base._id,
    id: row.id,
    partnerId: row.partnerId,
    date: toIso(row.date),
    productId: row.productId,
    productName: row.productName,
    price: row.price,
    litres: row.litres,
    totalCost: row.totalCost,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapBusinessExpenses(rows: PrismaExpense[]): BusinessExpense[] {
  return rows.map(mapBusinessExpense);
}

export function mapBusinessCredit(row: PrismaCredit): BusinessCredit {
  const base = withId(row);
  return {
    _id: base._id,
    id: row.id,
    partnerId: row.partnerId,
    date: toIso(row.date),
    shopName: row.shopName,
    productId: row.productId,
    productName: row.productName,
    price: row.price,
    litres: row.litres,
    totalPrice: row.totalPrice,
    amountPaid: row.amountPaid,
    status: row.status,
    expectedCollectionDate: toIso(row.expectedCollectionDate),
    collectedAt: toIso(row.collectedAt),
    convertedSaleId: row.convertedSaleId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapBusinessCredits(rows: PrismaCredit[]): BusinessCredit[] {
  return rows.map(mapBusinessCredit);
}

export function mapBusinessSale(row: PrismaSale): BusinessSale {
  const base = withId(row);
  return {
    _id: base._id,
    id: row.id,
    partnerId: row.partnerId,
    date: toIso(row.date),
    productId: row.productId,
    productName: row.productName,
    price: row.price,
    litres: row.litres,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapBusinessSales(rows: PrismaSale[]): BusinessSale[] {
  return rows.map(mapBusinessSale);
}
