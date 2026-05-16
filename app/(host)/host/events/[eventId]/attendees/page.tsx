import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type OrderStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { orderStatusBadge } from "@/app/_components/ui/Badge";
import { Pagination } from "@/app/_components/ui/Pagination";

const PAGE_SIZE = 10;

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const event = await prisma.event.findFirst({
    where: { id: eventId, hostId: user.id },
  });
  if (!event) redirect("/host/events");

  const where = { eventId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] as OrderStatus[] } };

  const [totalCount, allStats, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      select: {
        orderItems: {
          select: {
            quantity: true,
            tickets: { select: { checkedInAt: true } },
          },
        },
      },
    }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        promoCode: { select: { code: true } },
        orderItems: {
          include: {
            ticketType: { select: { name: true } },
            tickets: { select: { checkedInAt: true } },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const totalTickets = allStats.reduce(
    (s, o) => s + o.orderItems.reduce((ss, i) => ss + i.quantity, 0),
    0
  );
  const checkedIn = allStats.reduce(
    (s, o) =>
      s +
      o.orderItems.reduce(
        (ss, i) => ss + i.tickets.filter((t) => t.checkedInAt).length,
        0
      ),
    0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">参加者一覧</h2>
        <p className="text-sm text-gray-500">
          チェックイン {checkedIn} / {totalTickets}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">まだ参加者はいません</div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const orderCheckedIn = order.orderItems.reduce(
                (s, i) => s + i.tickets.filter((t) => t.checkedInAt).length,
                0
              );
              const orderTotal = order.orderItems.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{order.buyerName}</p>
                      <p className="text-sm text-gray-500 truncate">{order.buyerEmail}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {order.orderItems.map((item) => (
                          <span key={item.id} className="text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            {item.ticketType.name} × {item.quantity}
                          </span>
                        ))}
                        {order.promoCode && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-mono">
                            🏷 {order.promoCode.code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {orderStatusBadge(order.status)}
                      <span className="text-xs text-gray-400">
                        {orderCheckedIn}/{orderTotal} チェックイン済
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    購入: {order.createdAt.toLocaleDateString("ja-JP")} ·
                    ${Number(order.totalAmount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={`/host/events/${eventId}/attendees`}
          />
        </>
      )}
    </div>
  );
}
