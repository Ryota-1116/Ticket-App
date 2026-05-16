import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendTicketEmail } from "@/lib/email";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return new Response(null, { status: 200 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });
    if (!order || order.status !== "PENDING")
      return new Response(null, { status: 200 });

    // Stripe手数料・Charge IDを取得
    let stripeFee = 0;
    let stripeChargeId: string | null = null;
    if (session.payment_intent) {
      const intent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
        { expand: ["latest_charge.balance_transaction"] }
      );
      const charge = intent.latest_charge as Stripe.Charge | null;
      const bt = charge?.balance_transaction as Stripe.BalanceTransaction | null;
      stripeFee = (bt?.fee ?? 0) / 100;
      stripeChargeId = charge?.id ?? null;
    }

    // チケット生成
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          stripePaymentIntentId: session.payment_intent as string | null,
          stripeChargeId,
          stripeFee,
        },
      });

      for (const item of order.orderItems) {
        for (let i = 0; i < item.quantity; i++) {
          await tx.ticket.create({
            data: {
              orderItemId: item.id,
              qrCode: randomUUID(),
            },
          });
        }
      }
    });

    // メール送信（非同期、失敗してもOK）
    sendTicketEmail(orderId).catch(console.error);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }
  }

  return new Response(null, { status: 200 });
}
