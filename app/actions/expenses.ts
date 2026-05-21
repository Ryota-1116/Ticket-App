"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { requireEventAccess } from "@/lib/event-access";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ExpenseState = { error?: string; success?: boolean };

const ExpenseSchema = z.object({
  description: z.string().min(1, "説明を入力してください"),
  amount: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "有効な金額を入力してください"),
  occurredAt: z.string().min(1, "日付を入力してください"),
  paidBy: z.string().optional(),
});

export async function createExpense(
  eventId: string,
  _prev: ExpenseState,
  formData: FormData
): Promise<ExpenseState> {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);

  const parsed = ExpenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { description, amount, occurredAt, paidBy } = parsed.data;

  await prisma.expense.create({
    data: {
      eventId,
      description,
      paidBy: paidBy || null,
      amount: new Prisma.Decimal(parseFloat(amount)),
      occurredAt: new Date(occurredAt),
    },
  });

  revalidatePath(`/host/events/${eventId}/expenses`);
  return { success: true };
}

export async function updateExpense(
  eventId: string,
  expenseId: string,
  _prev: ExpenseState,
  formData: FormData
): Promise<ExpenseState> {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);

  const parsed = ExpenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { description, amount, occurredAt, paidBy } = parsed.data;

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      description,
      paidBy: paidBy || null,
      amount: new Prisma.Decimal(parseFloat(amount)),
      occurredAt: new Date(occurredAt),
    },
  });

  revalidatePath(`/host/events/${eventId}/expenses`);
  return { success: true };
}

export async function deleteExpense(eventId: string, expenseId: string) {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/host/events/${eventId}/expenses`);
}
