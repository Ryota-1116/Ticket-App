"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { type OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type WalkInState = { error?: string; success?: boolean; buyerName?: string };

const Schema = z.object({
  buyerName: z.string().min(1, "名前を入力してください"),
  buyerEmail: z.string().email("メールアドレスの形式が正しくありません").or(z.literal("")).optional(),
});

export async function createWalkInOrder(
  eventId: string,
  quantities: Record<string, number>,
  _prev: WalkInState,
  formData: FormData
): Promise<WalkInState> {
  const user = await requireAuth();

  const event = await prisma.event.findFirst({
    where: { id: eventId, hostId: user.id },
    include: { ticketTypes: true },
  });
  if (!event) return { error: "イベントが見つかりません" };

  const parsed = Schema.safeParse({
    buyerName: formData.get("buyerName"),
    buyerEmail: formData.get("buyerEmail") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { buyerName, buyerEmail } = parsed.data;
  const email = buyerEmail || `cash-${Date.now()}@walkin.local`;

  const selectedTypes = Object.entries(quantities).filter(([, qty]) => qty > 0);
  if (selectedTypes.length === 0) return { error: "チケットを1枚以上選択してください" };

  for (const [typeId, qty] of selectedTypes) {
    const tt = event.ticketTypes.find((t) => t.id === typeId);
    if (!tt) return { error: "無効なチケット種別です" };
    const sold = await prisma.orderItem.aggregate({
      where: {
        ticketTypeId: typeId,
        order: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] as OrderStatus[] } },
      },
      _sum: { quantity: true },
    });
    const remaining = tt.quantity - (sold._sum.quantity ?? 0);
    if (qty > remaining) return { error: `「${tt.name}」の在庫が不足しています（残り ${remaining} 枚）` };
  }

  let subtotal = new Prisma.Decimal(0);
  const lineItems: { ticketTypeId: string; quantity: number; unitPrice: Prisma.Decimal }[] = [];

  for (const [typeId, qty] of selectedTypes) {
    const tt = event.ticketTypes.find((t) => t.id === typeId)!;
    subtotal = subtotal.add(tt.price.mul(qty));
    lineItems.push({ ticketTypeId: typeId, quantity: qty, unitPrice: tt.price });
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        eventId,
        buyerName,
        buyerEmail: email,
        subtotal,
        discountAmount: 0,
        totalAmount: subtotal,
        stripeFee: 0,
        status: "PAID",
      },
    });

    for (const item of lineItems) {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      });

      const now = new Date();
      for (let i = 0; i < item.quantity; i++) {
        await tx.ticket.create({
          data: {
            orderItemId: orderItem.id,
            qrCode: crypto.randomUUID(),
            checkedInAt: now,
          },
        });
      }
    }
  });

  revalidatePath(`/host/events/${eventId}/attendees`);
  revalidatePath(`/host/events/${eventId}`);

  return { success: true, buyerName };
}
