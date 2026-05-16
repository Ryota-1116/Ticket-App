import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { eventStatusBadge } from "@/app/_components/ui/Badge";
import { publishEvent, unpublishEvent } from "@/app/actions/events";
import Link from "next/link";
import { DeleteEventButton } from "./_DeleteEventButton";
import { CopyButton } from "@/app/_components/ui/CopyButton";

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, hostId: user.id },
    include: {
      ticketTypes: true,
      orders: {
        where: { status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] } },
        include: { orderItems: true, refunds: true },
      },
      expenses: true,
    },
  });
  if (!event) redirect("/host/events");

  // 集計
  const totalSold = event.orders
    .filter((o) => o.status === "PAID" || o.status === "PARTIALLY_REFUNDED")
    .reduce((s, o) => s + o.orderItems.reduce((ss, i) => ss + i.quantity, 0), 0);
  const grossRevenue = event.orders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const totalFees = event.orders.reduce((s, o) => s + Number(o.stripeFee), 0);
  const totalRefunds = event.orders.reduce((s, o) => s + Number(o.refundedAmount), 0);
  const totalExpenses = event.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = grossRevenue - totalFees - totalRefunds - totalExpenses;

  const startDate = event.startAt.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const startTime = event.startAt.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const publicUrl = `${appUrl}/events/${eventId}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{event.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {startDate} {startTime} · {event.location}
          </p>
        </div>
        {eventStatusBadge(event.status)}
      </div>

      {/* ダッシュボード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "販売枚数", value: `${totalSold} 枚` },
          { label: "売上", value: `$${grossRevenue.toFixed(2)}` },
          { label: "手数料・返金", value: `-$${(totalFees + totalRefunds).toFixed(2)}` },
          { label: "純利益", value: `$${netProfit.toFixed(2)}`, highlight: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl border p-4 ${stat.highlight ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${stat.highlight ? "text-blue-700" : "text-gray-900"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* 公開URL */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">公開URL（ゲスト向け）</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={publicUrl}
            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 min-w-0"
          />
          <CopyButton text={publicUrl} />
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm text-blue-600 hover:underline"
          >
            開く
          </a>
        </div>
      </div>

      {/* アクション */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700">操作</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/host/events/${eventId}/edit`}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ✏️ 編集
          </Link>

          {event.status === "DRAFT" ? (
            <form
              action={async () => {
                "use server";
                await publishEvent(eventId);
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
              >
                🌐 公開する
              </button>
            </form>
          ) : event.status === "PUBLISHED" ? (
            <form
              action={async () => {
                "use server";
                await unpublishEvent(eventId);
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                非公開にする
              </button>
            </form>
          ) : null}

          <DeleteEventButton eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
