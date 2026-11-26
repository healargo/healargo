import type { CREDIT_STATUS } from "@/constants/business";

export type CreditStatus = (typeof CREDIT_STATUS)[keyof typeof CREDIT_STATUS];

export interface BusinessPartnerOwner {
  _id: string;
  name: string;
  email: string;
}

export interface BusinessPartner {
  _id: string;
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  owner?: BusinessPartnerOwner;
}

export interface BusinessExpense {
  _id: string;
  id: string;
  partnerId: string;
  date: string | null;
  productId: string | null;
  productName: string | null;
  price: number | null;
  litres: number | null;
  totalCost: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCredit {
  _id: string;
  id: string;
  partnerId: string;
  date: string | null;
  shopName: string | null;
  productId: string | null;
  productName: string | null;
  price: number | null;
  litres: number | null;
  totalPrice: number | null;
  amountPaid: number;
  status: CreditStatus;
  expectedCollectionDate: string | null;
  collectedAt: string | null;
  convertedSaleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSale {
  _id: string;
  id: string;
  partnerId: string;
  date: string | null;
  productId: string | null;
  productName: string | null;
  price: number | null;
  litres: number | null;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProductOption {
  _id: string;
  name: string;
}

export interface BusinessEntryInput {
  date?: string | null;
  productId?: string | null;
  productName?: string | null;
  price?: number | null;
  litres?: number | null;
  shopName?: string | null;
  amountPaid?: number | null;
  status?: CreditStatus | null;
  expectedCollectionDate?: string | null;
}

export interface BusinessPartnerStats {
  expensesTotal: number;
  salesTotal: number;
  creditOutstanding: number;
  creditCollected: number;
}

export interface BusinessPartnerSummary {
  expensesTotal: number;
  salesTotal: number;
  creditOutstanding: number;
  dueReminders: number;
  recordCount: number;
}

export type BusinessPartnerListItem = BusinessPartner & {
  summary: BusinessPartnerSummary;
};
