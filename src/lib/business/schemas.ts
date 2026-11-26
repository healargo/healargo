import { z } from "zod";
import { CREDIT_STATUS } from "@/constants/business";

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const optionalNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null || value === "") return null;
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid number" });
      return z.NEVER;
    }
    return num;
  });

const optionalDate = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null || value === "") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
      return z.NEVER;
    }
    return date;
  });

export const partnerCreateSchema = z.object({
  name: z.string().trim().min(1, "Partner name is required").max(120),
});

export const partnerUpdateSchema = z.object({
  name: z.string().trim().min(1, "Partner name is required").max(120).optional(),
  isActive: z.boolean().optional(),
});

export const expenseUpsertSchema = z.object({
  date: optionalDate,
  productId: optionalString,
  productName: optionalString,
  price: optionalNumber,
  litres: optionalNumber,
});

export const creditUpsertSchema = z.object({
  date: optionalDate,
  shopName: optionalString,
  productId: optionalString,
  productName: optionalString,
  price: optionalNumber,
  litres: optionalNumber,
  amountPaid: optionalNumber,
  expectedCollectionDate: optionalDate,
  status: z
    .enum([
      CREDIT_STATUS.UNPAID,
      CREDIT_STATUS.PARTIAL,
      CREDIT_STATUS.PAID,
    ])
    .nullable()
    .optional(),
});

export const creditCollectSchema = z.object({
  collected: z.boolean(),
});

export const saleUpsertSchema = z.object({
  date: optionalDate,
  productId: optionalString,
  productName: optionalString,
  price: optionalNumber,
  litres: optionalNumber,
});
