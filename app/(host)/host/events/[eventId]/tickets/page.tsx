import { requireAuth } from "@/lib/auth";
import { eventAccessWhere } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { deleteTicketType } from "@/app/actions/tickets";
import { TicketTypeForm } from "./_TicketTypeForm";
import { TicketTypeCard } from "./_TicketTypeCard";

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: eventAccessWhere(eventId, user.id),
    include: {
      ticketTypes: {
        orderBy: { createdAt: "asc" },
        include: {
          orderItems: {
            where: { order: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } } },
            select: { quantity: true },
          },
        },
      },
    },
  });
  if (!event) redirect("/host/events");


  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <h2 className="text-lg font-bold text-gray-900">チケット種類</h2>

      {event.ticketTypes.length > 0 && (
        <div className="flex flex-col gap-3">
          {event.ticketTypes.map((tt) => {
            const sold = tt.orderItems.reduce((s, i) => s + i.quantity, 0);
            const remaining = tt.quantity - sold;
            const deleteAction = async () => {
              "use server";
              await deleteTicketType(eventId, tt.id);
            };
            return (
              <TicketTypeCard
                key={tt.id}
                eventId={eventId}
                ticketType={{
                  id: tt.id,
                  name: tt.name,
                  description: tt.description,
                  price: Number(tt.price).toFixed(2),
                  quantity: tt.quantity,
                  remaining,
                  sold,
                  salesStartAt: tt.salesStartAt ? toDatetimeLocal(tt.salesStartAt) : null,
                  salesEndAt: tt.salesEndAt ? toDatetimeLocal(tt.salesEndAt) : null,
                }}
                deleteAction={deleteAction}
              />
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">チケット種類を追加</p>
        <TicketTypeForm eventId={eventId} />
      </div>
    </div>
  );
}
