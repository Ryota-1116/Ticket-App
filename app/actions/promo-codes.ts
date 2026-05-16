"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { requireEventAccess } from "@/lib/event-access";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type PromoCodeState = { error?: string; success?: boolean };

const PromoCodeSchema = z.object({
  code: z.string().min(1, "コードを入力してください"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "有効な値を入力してください"),
  maxUses: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export async function createPromoCode(
  eventId: string,
  _prev: PromoCodeState,
  formData: FormData
): Promise<PromoCodeState> {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);

  const parsed = PromoCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { code, discountType, discountValue, maxUses, validFrom, validUntil } =
    parsed.data;

  const normalizedCode = code.toUpperCase();
  const existing = await prisma.promoCode.findUnique({
    where: { eventId_code: { eventId, code: normalizedCode } },
  });
  if (existing) return { error: "このコードはすでに使用されています" };

  await prisma.promoCode.create({
    data: {
      eventId,
      code: normalizedCode,
      discountType,
      discountValue: new Prisma.Decimal(parseFloat(discountValue)),
      maxUses: maxUses ? parseInt(maxUses) : null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
    },
  });

  revalidatePath(`/host/events/${eventId}/promo-codes`);
  return { success: true };
}

export async function updatePromoCode(
  eventId: string,
  promoCodeId: string,
  _prev: PromoCodeState,
  formData: FormData
): Promise<PromoCodeState> {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);

  const parsed = PromoCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { code, discountType, discountValue, maxUses, validFrom, validUntil } = parsed.data;

  const normalizedCode = code.toUpperCase();
  const conflict = await prisma.promoCode.findFirst({
    where: { eventId, code: normalizedCode, NOT: { id: promoCodeId } },
  });
  if (conflict) return { error: "このコードはすでに使用されています" };

  await prisma.promoCode.update({
    where: { id: promoCodeId },
    data: {
      code: normalizedCode,
      discountType,
      discountValue: new Prisma.Decimal(parseFloat(discountValue)),
      maxUses: maxUses ? parseInt(maxUses) : null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
    },
  });

  revalidatePath(`/host/events/${eventId}/promo-codes`);
  return { success: true };
}

export async function deletePromoCode(eventId: string, promoCodeId: string) {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);
  await prisma.promoCode.delete({ where: { id: promoCodeId } });
  revalidatePath(`/host/events/${eventId}/promo-codes`);
}
