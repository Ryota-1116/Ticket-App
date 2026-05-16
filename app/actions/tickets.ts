"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { requireEventAccess } from "@/lib/event-access";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type TicketTypeState = { error?: string; success?: boolean };

const TicketTypeSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  description: z.string().optional(),
  price: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "有効な価格を入力してください"),
  quantity: z
    .string()
    .refine((v) => !isNaN(parseInt(v)) && parseInt(v) > 0, "1以上の枚数を入力してください"),
  salesStartAt: z.string().optional(),
  salesEndAt: z.string().optional(),
});

export async function createTicketType(
  eventId: string,
  _prev: TicketTypeState,
  formData: FormData
): Promise<TicketTypeState> {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);

  const parsed = TicketTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { name, description, price, quantity, salesStartAt, salesEndAt } =
    parsed.data;

  await prisma.ticketType.create({
    data: {
      eventId,
      name,
      description: description || null,
      price: new Prisma.Decimal(parseFloat(price)),
      quantity: parseInt(quantity),
      salesStartAt: salesStartAt ? new Date(salesStartAt) : null,
      salesEndAt: salesEndAt ? new Date(salesEndAt) : null,
    },
  });

  revalidatePath(`/host/events/${eventId}/tickets`);
  return { success: true };
}

export async function updateTicketType(
  eventId: string,
  ticketTypeId: string,
  _prev: TicketTypeState,
  formData: FormData
): Promise<TicketTypeState> {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);

  const parsed = TicketTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { name, description, price, quantity, salesStartAt, salesEndAt } =
    parsed.data;

  await prisma.ticketType.update({
    where: { id: ticketTypeId },
    data: {
      name,
      description: description || null,
      price: new Prisma.Decimal(parseFloat(price)),
      quantity: parseInt(quantity),
      salesStartAt: salesStartAt ? new Date(salesStartAt) : null,
      salesEndAt: salesEndAt ? new Date(salesEndAt) : null,
    },
  });

  revalidatePath(`/host/events/${eventId}/tickets`);
  return { success: true };
}

export async function deleteTicketType(eventId: string, ticketTypeId: string) {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);
  await prisma.ticketType.delete({ where: { id: ticketTypeId } });
  revalidatePath(`/host/events/${eventId}/tickets`);
}
