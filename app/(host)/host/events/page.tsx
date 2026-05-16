import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { eventStatusBadge } from "@/app/_components/ui/Badge";

async function fetchStats(hostId: string, from?: Date) {
  const orderWhere = {
    event: { hostId },
    status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] as const },
    ...(from ? { createdAt: { gte: from } } : {}),
  };
  const expenseWhere = {
    event: { hostId },
    ...(from ? { occurredAt: { gte: from } } : {}),
  };

  const [orders, expenses] = await Promise.all([
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { totalAmount: true, stripeFee: true, refundedAmount: true },
    }),
    prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    }),
  ]);

  const gross = Number(orders._sum.totalAmount ?? 0);
  const fees = Number(orders._sum.stripeFee ?? 0);
  const refunds = Number(orders._sum.refundedAmount ?? 0);
  const expenseTotal = Number(expenses._sum.amount ?? 0);
  return { gross, net: gross - fees - refunds - expenseTotal };
}

export default async function EventsPage() {
  const user = await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [events, monthStats, yearStats, allStats] = await Promise.all([
    prisma.event.findMany({
      where: { hostId: user.id },
      orderBy: { startAt: "desc" },
      include: {
        _count: { select: { ticketTypes: true } },
        orders: {
          where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
          select: { totalAmount: true },
        },
      },
    }),
    fetchStats(user.id, startOfMonth),
    fetchStats(user.id, startOfYear),
    fetchStats(user.id),
  ]);

  const statColumns = [
    { label: "今月", ...monthStats },
    { label: "今年", ...yearStats },
    { label: "累計", ...allStats },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">イベント一覧</h1>
        <Link
          href="/host/events/new"
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + 新規作成
        </Link>
      </div>

      {/* 売上サマリー */}
      <div className="grid grid-cols-3 gap-3">
        {statColumns.map(({ label, gross, net }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-400 mb-2">{label}</p>
            <div className="flex flex-col gap-1.5">
              <div>
                <p className="text-xs text-gray-500">売上</p>
                <p className="text-base font-bold text-gray-900">${gross.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">純利益</p>
                <p className={`text-base font-bold ${net < 0 ? "text-red-600" : "text-blue-700"}`}>
                  ${net.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <span className="text-4xl">🎪</span>
          <p className="mt-3 text-gray-500 font-medium">まだイベントがありません</p>
          <p className="text-sm text-gray-400 mt-1">最初のイベントを作成しましょう</p>
          <Link
            href="/host/events/new"
            className="mt-4 inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            イベントを作成する
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => {
            const revenue = event.orders.reduce(
              (sum, o) => sum + Number(o.totalAmount),
              0
            );
            const startDate = event.startAt.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            return (
              <Link
                key={event.id}
                href={`/host/events/${event.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{startDate}</p>
                    <p className="text-sm text-gray-400 mt-0.5 truncate">📍 {event.location}</p>
                  </div>
                  <div className="shrink-0">{eventStatusBadge(event.status)}</div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span>チケット {event._count.ticketTypes} 種</span>
                  <span>売上 ${revenue.toFixed(2)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
