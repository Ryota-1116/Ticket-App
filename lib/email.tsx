import { Resend } from "resend";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function sendRefundEmail(orderId: string, refundAmount: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { event: { select: { title: true, startAt: true, location: true } } },
  });
  if (!order) return;

  const isFullRefund = refundAmount >= Number(order.totalAmount);

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: order.buyerEmail,
    subject: `Refund Confirmation — ${order.event.title}`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;color:#111827;">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Your refund has been processed</h2>
        <p style="color:#6b7280;margin-bottom:24px;">Hi ${order.buyerName},</p>

        <p style="color:#374151;margin-bottom:24px;">
          ${isFullRefund
            ? `Your order for <strong>${order.event.title}</strong> has been fully refunded.`
            : `A partial refund has been issued for your order for <strong>${order.event.title}</strong>.`
          }
        </p>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
            <tr><td style="padding:4px 0;color:#6b7280;">Event</td><td style="padding:4px 0;">${order.event.title}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Refund amount</td><td style="padding:4px 0;font-weight:700;color:#dc2626;">$${refundAmount.toFixed(2)} CAD</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Order total</td><td style="padding:4px 0;">$${Number(order.totalAmount).toFixed(2)} CAD</td></tr>
          </table>
        </div>

        <p style="color:#6b7280;font-size:14px;">
          Please allow <strong>5–10 business days</strong> for the refund to appear on your statement, depending on your card issuer.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;">Order ID: ${order.id}</p>
      </div>
    `,
  });
}

export async function sendPurchaseNotification(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: { select: { id: true, title: true, hostId: true } },
      orderItems: { include: { ticketType: { select: { name: true } } } },
    },
  });
  if (!order) return;

  const [host, collaborators] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: order.event.hostId },
      select: { email: true },
    }),
    prisma.eventCollaborator.findMany({
      where: { eventId: order.event.id },
      include: { user: { select: { email: true } } },
    }),
  ]);

  const adminEmails = [
    host?.email,
    ...collaborators.map((c) => c.user.email),
  ].filter((e): e is string => !!e);

  if (adminEmails.length === 0) return;

  const itemLines = order.orderItems
    .map((i) => `${i.ticketType.name} × ${i.quantity}`)
    .join(", ");

  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:sans-serif;color:#111827;">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:16px;">チケット購入がありました</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
        <tr><td style="padding:6px 0;color:#6b7280;">イベント</td><td style="padding:6px 0;font-weight:600;">${order.event.title}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">購入者</td><td style="padding:6px 0;">${order.buyerName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">メール</td><td style="padding:6px 0;">${order.buyerEmail}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">チケット</td><td style="padding:6px 0;">${itemLines}</td></tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:10px 0 4px;font-weight:700;">合計</td>
          <td style="padding:10px 0 4px;font-weight:700;">$${Number(order.totalAmount).toFixed(2)} CAD</td>
        </tr>
      </table>
    </div>
  `;

  await Promise.all(
    adminEmails.map((email) =>
      getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: `New ticket purchase — ${order.event.title}`,
        html,
      })
    )
  );
}

export async function sendTicketEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      promoCode: true,
      orderItems: {
        include: {
          ticketType: true,
          tickets: true,
        },
      },
    },
  });
  if (!order) return;

  const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/confirmation`;

  const ticketsHtml = await Promise.all(
    order.orderItems.flatMap((item) =>
      item.tickets.map(async (ticket) => {
        const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, { width: 200 });
        return `
          <div style="margin-bottom:24px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="margin:0 0 8px;font-weight:600;">${item.ticketType.name}</p>
            <a href="${confirmationUrl}" style="display:block;">
              <img src="${qrDataUrl}" alt="QR Code" width="160" height="160" style="display:block;" />
            </a>
            <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;text-align:center;">Tap to view full-size</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;word-break:break-all;">${ticket.qrCode}</p>
          </div>
        `;
      })
    )
  );

  const eventDate = order.event.startAt.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const eventTime = order.event.startAt.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: order.buyerEmail,
    subject: `Your tickets for ${order.event.title}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif;color:#111827;">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Your tickets are confirmed!</h1>
        <p style="color:#6b7280;margin-bottom:24px;">Hi ${order.buyerName}, here are your tickets.</p>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:24px;">
          <h2 style="font-size:18px;font-weight:600;margin:0 0 8px;">${order.event.title}</h2>
          <p style="margin:4px 0;color:#374151;">📅 ${eventDate}</p>
          <p style="margin:4px 0;color:#374151;">🕐 ${eventTime}</p>
          <p style="margin:4px 0;color:#374151;">📍 ${order.event.location}</p>
        </div>

        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;">Your tickets</h3>
        <p style="color:#6b7280;font-size:14px;margin-bottom:16px;">
          Please show the QR code at the entrance. Each QR code is valid for one entry.
        </p>
        ${ticketsHtml.join("")}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

        <h3 style="font-size:16px;font-weight:600;margin:0 0 12px;">Order Summary</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
          ${order.orderItems.map((item) => `
          <tr>
            <td style="padding:6px 0;">${item.ticketType.name} × ${item.quantity}</td>
            <td style="padding:6px 0;text-align:right;">$${(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
          </tr>`).join("")}
          ${order.discountAmount.gt(0) ? `
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Subtotal</td>
            <td style="padding:6px 0;text-align:right;color:#6b7280;">$${Number(order.subtotal).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#16a34a;">Discount${order.promoCode ? ` (${order.promoCode.code})` : ""}</td>
            <td style="padding:6px 0;text-align:right;color:#16a34a;">−$${Number(order.discountAmount).toFixed(2)}</td>
          </tr>` : ""}
          <tr style="border-top:1px solid #e5e7eb;">
            <td style="padding:10px 0 4px;font-weight:700;">Total</td>
            <td style="padding:10px 0 4px;text-align:right;font-weight:700;">$${Number(order.totalAmount).toFixed(2)} CAD</td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;">Order ID: ${order.id}</p>
      </div>
    `,
  });
}
