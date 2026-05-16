"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type RefundState = { error?: string; success?: boolean };

const RefundSchema = z.object({
  amount: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "有効な金額を入力してください"),
  reason: z.string().optional(),
});

async function requireEventOwner(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, hostId: userId },
  });
  if (!event) redirect("/host/events");
  return event;
}

export async function createRefund(
  orderId: string,
  _prev: RefundState,
  formData: FormData
): Promise<RefundState> {
  const user = await requireAuth();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { event: true },
  });
  if (!order) return { error: "注文が見つかりません" };
  await requireEventOwner(order.eventId, user.id);

  if (order.status !== "PAID" && order.status !== "PARTIALLY_REFUNDED")
    return { error: "返金できない注文です" };

  const parsed = RefundSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const refundAmount = new Prisma.Decimal(parseFloat(parsed.data.amount));
  const maxRefundable = order.totalAmount.sub(order.refundedAmount);

  if (refundAmount.gt(maxRefundable))
    return { error: `返金可能額は $${maxRefundable.toFixed(2)} までです` };

  if (!order.stripePaymentIntentId)
    return { error: "支払い情報が見つかりません" };

  const stripeRefund = await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    amount: Math.round(refundAmount.mul(100).toNumber()),
  });

  const newRefundedAmount = order.refundedAmount.add(refundAmount);
  const isFullRefund = newRefundedAmount.gte(order.totalAmount);

  await prisma.$transaction([
    prisma.refund.create({
      data: {
        orderId,
        stripeRefundId: stripeRefund.id,
        amount: refundAmount,
        reason: parsed.data.reason || null,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        refundedAmount: newRefundedAmount,
        status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    }),
  ]);

  revalidatePath(`/host/events/${order.eventId}/refunds`);
  return { success: true };
}
