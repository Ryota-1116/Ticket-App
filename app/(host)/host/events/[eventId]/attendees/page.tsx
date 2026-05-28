import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { requireEventAccess } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { type OrderStatus } from "@prisma/client";
import { orderStatusBadge } from "@/app/_components/ui/Badge";
import { Pagination } from "@/app/_components/ui/Pagination";
import { deleteWalkInOrder } from "@/app/actions/walk-in";
import { DeleteButton } from "@/app/_components/ui/DeleteButton";

const PAGE_SIZE = 10;

type FilterType = "online" | "cash" | "etransfer" | undefined;

function paymentMethodBadge(paymentMethod: string | null, stripePaymentIntentId: string | null) {
  if (stripePaymentIntentId) return null;
  if (paymentMethod === "E_TRANSFER") {
    return (
      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
        e-transfer
      </span>
    );
  }
  return (
    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
      現金
    </span>
  );
}

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;
  const { page: pageParam, type: typeParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const type = (["online", "cash", "etransfer"].includes(typeParam ?? "") ? typeParam : undefined) as FilterType;

  await requireEventAccess(eventId, user.id);

  const baseWhere = { eventId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] as OrderStatus[] } };

  const typeFilter =
    type === "online"
      ? { stripePaymentIntentId: { not: null } }
      : type === "cash"
      ? { OR: [{ paymentMethod: "CASH" }, { stripePaymentIntentId: null as string | null, paymentMethod: null as string | null }] }
      : type === "etransfer"
      ? { paymentMethod: "E_TRANSFER" }
      : {};

  const where = { ...baseWhere, ...typeFilter };

  const [totalCount, onlineCount, cashCount, etransferCount, allStats, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({ where: { ...baseWhere, stripePaymentIntentId: { not: null } } }),
    prisma.order.count({
      where: {
        ...baseWhere,
        OR: [{ paymentMethod: "CASH" }, { stripePaymentIntentId: null, paymentMethod: null }],
      },
    }),
    prisma.order.count({ where: { ...baseWhere, paymentMethod: "E_TRANSFER" } }),
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

  const filterBase = `/host/events/${eventId}/attendees`;

  const filterCards: { label: string; count: number; value: FilterType }[] = [
    { label: "すべて", count: onlineCount + cashCount + etransferCount, value: undefined },
    { label: "オンライン", count: onlineCount, value: "online" },
    { label: "現金", count: cashCount, value: "cash" },
    { label: "e-transfer", count: etransferCount, value: "etransfer" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">参加者一覧</h2>
        <p className="text-sm text-gray-500">
          チェックイン {checkedIn} / {totalTickets}
        </p>
      </div>

      {/* 支払方法フィルター */}
      <div className="grid grid-cols-4 gap-2">
        {filterCards.map(({ label, count, value }) => {
          const isActive = type === value;
          const href = value ? `${filterBase}?type=${value}` : filterBase;
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center rounded-xl border px-3 py-3 text-center transition-colors ${
                isActive
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className={`text-xl font-bold ${isActive ? "text-blue-700" : "text-gray-900"}`}>
                {count}
              </span>
              <span className="text-xs mt-0.5">{label}</span>
            </Link>
          );
        })}
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
              const isWalkIn = !order.stripePaymentIntentId;
              const deleteAction = isWalkIn
                ? deleteWalkInOrder.bind(null, eventId, order.id)
                : null;

              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{order.buyerName}</p>
                        {paymentMethodBadge(order.paymentMethod, order.stripePaymentIntentId)}
                      </div>
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
                      {deleteAction && (
                        <form action={deleteAction}>
                          <DeleteButton label="削除" />
                        </form>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    登録: {order.createdAt.toLocaleDateString("ja-JP")} ·
                    ${Number(order.totalAmount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={filterBase}
            extraQuery={type ? `type=${type}` : undefined}
          />
        </>
      )}
    </div>
  );
}
