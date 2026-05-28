import { requireAuth } from "@/lib/auth";
import { eventAccessWhere } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { type OrderStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { WalkInForm } from "./_WalkInForm";

export default async function WalkInPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: eventAccessWhere(eventId, user.id),
    include: { ticketTypes: { orderBy: { price: "asc" } } },
  });
  if (!event) redirect("/host/events");

  const ticketTypesWithRemaining = await Promise.all(
    event.ticketTypes.map(async (tt) => {
      const sold = await prisma.orderItem.aggregate({
        where: {
          ticketTypeId: tt.id,
          order: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] as OrderStatus[] } },
        },
        _sum: { quantity: true },
      });
      const remaining = tt.quantity !== null ? tt.quantity - (sold._sum.quantity ?? 0) : null;
      return {
        id: tt.id,
        name: tt.name,
        price: Number(tt.price).toFixed(2),
        remaining,
      };
    })
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">当日受付</h2>
        <p className="text-sm text-gray-500 mt-1">
          当日受付の参加者をシステムに登録します。
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <WalkInForm eventId={eventId} ticketTypes={ticketTypesWithRemaining} />
      </div>
    </div>
  );
}
