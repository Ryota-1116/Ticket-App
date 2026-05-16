import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type OrderStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { orderStatusBadge } from "@/app/_components/ui/Badge";
import { RefundForm } from "./_RefundForm";
import { Pagination } from "@/app/_components/ui/Pagination";

const PAGE_SIZE = 10;

export default async function RefundsPage({
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

  const where = {
    eventId,
    status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] as OrderStatus[] },
  };

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        refunds: { orderBy: { createdAt: "desc" } },
        orderItems: { include: { ticketType: { select: { name: true } } } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
      <h2 className="text-lg font-bold text-gray-900">返金管理</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">支払済みの注文はまだありません</div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const maxRefundable =
                Number(order.totalAmount) - Number(order.refundedAmount);
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{order.buyerName}</p>
                      <p className="text-sm text-gray-500 truncate">{order.buyerEmail}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {order.orderItems.map((item) => (
                          <span key={item.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                            {item.ticketType.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    {orderStatusBadge(order.status)}
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <span>合計 ${Number(order.totalAmount).toFixed(2)}</span>
                    {Number(order.refundedAmount) > 0 && (
                      <span className="text-red-500">返金済 ${Number(order.refundedAmount).toFixed(2)}</span>
                    )}
                  </div>

                  {order.refunds.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {order.refunds.map((r) => (
                        <p key={r.id} className="text-xs text-gray-400">
                          {r.createdAt.toLocaleDateString("ja-JP")} · ${Number(r.amount).toFixed(2)} 返金
                          {r.reason && ` · ${r.reason}`}
                        </p>
                      ))}
                    </div>
                  )}

                  {maxRefundable > 0 && (
                    <RefundForm orderId={order.id} maxRefundable={maxRefundable} />
                  )}
                </div>
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={`/host/events/${eventId}/refunds`}
          />
        </>
      )}
    </div>
  );
}
