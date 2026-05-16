"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

export type PurchaseState = { error?: string; sessionUrl?: string };

const PurchaseSchema = z.object({
  buyerName: z.string().min(1, "Name is required"),
  buyerEmail: z.string().email("Invalid email address"),
  promoCode: z.string().optional(),
});

export async function createCheckoutSession(
  eventId: string,
  quantities: Record<string, number>,
  _prev: PurchaseState,
  formData: FormData
): Promise<PurchaseState> {
  const parsed = PurchaseSchema.safeParse({
    buyerName: formData.get("buyerName"),
    buyerEmail: formData.get("buyerEmail"),
    promoCode: formData.get("promoCode") || undefined,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Please check your input" };

  const { buyerName, buyerEmail, promoCode } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId, status: "PUBLISHED" },
    include: { ticketTypes: true },
  });
  if (!event) return { error: "Event not found" };

  const selectedTypes = Object.entries(quantities).filter(([, qty]) => qty > 0);
  if (selectedTypes.length === 0) return { error: "Please select at least one ticket" };

  for (const [typeId, qty] of selectedTypes) {
    const tt = event.ticketTypes.find((t) => t.id === typeId);
    if (!tt) return { error: "Invalid ticket type" };
    const sold = await prisma.orderItem.aggregate({
      where: {
        ticketTypeId: typeId,
        order: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
      },
      _sum: { quantity: true },
    });
    const remaining = tt.quantity - (sold._sum.quantity ?? 0);
    if (qty > remaining)
      return { error: `"${tt.name}" is sold out or has insufficient stock` };
  }

  let subtotal = new Prisma.Decimal(0);
  const lineItems: { ticketTypeId: string; quantity: number; unitPrice: Prisma.Decimal }[] = [];

  for (const [typeId, qty] of selectedTypes) {
    const tt = event.ticketTypes.find((t) => t.id === typeId)!;
    subtotal = subtotal.add(tt.price.mul(qty));
    lineItems.push({ ticketTypeId: typeId, quantity: qty, unitPrice: tt.price });
  }

  let discountAmount = new Prisma.Decimal(0);
  let promoCodeRecord = null;

  if (promoCode) {
    promoCodeRecord = await prisma.promoCode.findUnique({
      where: { eventId_code: { eventId, code: promoCode.toUpperCase() } },
    });
    if (!promoCodeRecord) return { error: "Invalid promo code" };
    if (
      promoCodeRecord.maxUses !== null &&
      promoCodeRecord.usedCount >= promoCodeRecord.maxUses
    )
      return { error: "This promo code has reached its usage limit" };
    if (promoCodeRecord.validUntil && promoCodeRecord.validUntil < new Date())
      return { error: "This promo code has expired" };
    if (promoCodeRecord.validFrom && promoCodeRecord.validFrom > new Date())
      return { error: "This promo code is not yet active" };

    discountAmount =
      promoCodeRecord.discountType === "PERCENTAGE"
        ? subtotal.mul(promoCodeRecord.discountValue).div(100)
        : Prisma.Decimal.min(promoCodeRecord.discountValue, subtotal);
  }

  const totalAmount = subtotal.sub(discountAmount);

  const order = await prisma.order.create({
    data: {
      eventId,
      buyerName,
      buyerEmail,
      promoCodeId: promoCodeRecord?.id ?? null,
      subtotal,
      discountAmount,
      totalAmount,
      status: "PENDING",
    },
  });

  for (const item of lineItems) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      },
    });
  }

  if (promoCodeRecord) {
    await prisma.promoCode.update({
      where: { id: promoCodeRecord.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  const stripeLineItems = lineItems.map((item) => {
    const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId)!;
    return {
      price_data: {
        currency: "cad",
        product_data: { name: `${event.title} — ${tt.name}` },
        unit_amount: Math.round(item.unitPrice.mul(100).toNumber()),
      },
      quantity: item.quantity,
    };
  });

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    line_items: stripeLineItems,
    mode: "payment",
    locale: "en",
    customer_email: buyerEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/confirmation`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}`,
    metadata: { orderId: order.id },
  };

  if (discountAmount.gt(0)) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(discountAmount.mul(100).toNumber()),
      currency: "cad",
      duration: "once",
      name: promoCode ?? "Discount",
    });
    sessionParams.discounts = [{ coupon: coupon.id }];
  }

  const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

  if (checkoutSession.payment_intent) {
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: checkoutSession.payment_intent as string },
    });
  }

  return { sessionUrl: checkoutSession.url! };
}
