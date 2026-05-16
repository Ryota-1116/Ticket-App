"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type CheckinResult =
  | { success: true; attendeeName: string; ticketName: string }
  | { success: false; error: string };

export async function checkinByQrCode(
  eventId: string,
  qrCode: string
): Promise<CheckinResult> {
  await requireAuth();

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: {
      orderItem: {
        include: {
          order: { select: { eventId: true, buyerName: true, status: true } },
          ticketType: { select: { name: true } },
        },
      },
    },
  });

  if (!ticket) return { success: false, error: "無効なQRコードです" };
  if (ticket.orderItem.order.eventId !== eventId)
    return { success: false, error: "このイベントのチケットではありません" };
  if (ticket.orderItem.order.status !== "PAID" && ticket.orderItem.order.status !== "PARTIALLY_REFUNDED")
    return { success: false, error: "有効な支払い済みチケットではありません" };
  if (ticket.checkedInAt)
    return { success: false, error: `チェックイン済みです（${ticket.checkedInAt.toLocaleString("ja-JP")}）` };

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { checkedInAt: new Date() },
  });

  revalidatePath(`/host/events/${eventId}/attendees`);

  return {
    success: true,
    attendeeName: ticket.orderItem.order.buyerName,
    ticketName: ticket.orderItem.ticketType.name,
  };
}
