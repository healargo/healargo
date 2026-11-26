import type { BusinessCredit } from "@/types/business";

function startOfTodayIst(): Date {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  ist.setHours(0, 0, 0, 0);
  return ist;
}

export function reminderCredits(credits: BusinessCredit[]): BusinessCredit[] {
  return credits
    .filter((credit) => credit.expectedCollectionDate)
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.expectedCollectionDate!).getTime();
      const bTime = new Date(b.expectedCollectionDate!).getTime();
      return aTime - bTime;
    });
}

export type ReminderDueTone = "overdue" | "today" | "upcoming" | "collected";

export function reminderDueTone(credit: BusinessCredit): ReminderDueTone {
  if (credit.convertedSaleId || credit.collectedAt) return "collected";
  const expected = credit.expectedCollectionDate;
  if (!expected) return "upcoming";
  const due = new Date(expected);
  const dueDay = new Date(
    due.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  dueDay.setHours(0, 0, 0, 0);
  const today = startOfTodayIst();
  if (dueDay.getTime() < today.getTime()) return "overdue";
  if (dueDay.getTime() === today.getTime()) return "today";
  return "upcoming";
}
