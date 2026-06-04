import { requireAuth } from "@/lib/auth";
import { eventAccessWhere } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { eventStatusBadge } from "@/app/_components/ui/Badge";
import { publishEvent, unpublishEvent } from "@/app/actions/events";
import { removeCollaborator } from "@/app/actions/collaborators";
import { CollaboratorForm } from "./_CollaboratorForm";
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
    where: eventAccessWhere(eventId, user.id),
    include: {
      ticketTypes: true,
      orders: {
        where: { status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] } },
        include: { orderItems: true, refunds: true },
      },
      expenses: true,
      collaborators: { include: { user: { select: { id: true, email: true, name: true } } } },
    },
  });
  if (!event) redirect("/host/events");

  const isOwner = event.hostId === user.id; // 共有メンバー管理のみオーナー限定

  // 集計 — REFUNDED（全額返金済み）は売上・返金どちらからも除外。
  // 全額返金の net は $0 のため除外しても純利益は変わらない。
  // ただし Stripe 手数料は返金されない可能性があるため全注文から合算する。
  const activeOrders = event.orders.filter(
    (o) => o.status === "PAID" || o.status === "PARTIALLY_REFUNDED"
  );
  const totalSold = activeOrders.reduce(
    (s, o) => s + o.orderItems.reduce((ss, i) => ss + i.quantity, 0), 0
  );
  const grossRevenue = activeOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const totalFees = event.orders.reduce((s, o) => s + Number(o.stripeFee), 0);
  const totalRefunds = activeOrders.reduce((s, o) => s + Number(o.refundedAmount), 0);
  const totalExpenses = event.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = grossRevenue - totalFees - totalRefunds - totalExpenses;

  const onlineRevenue = activeOrders
    .filter((o) => o.stripePaymentIntentId !== null)
    .reduce((s, o) => s + Number(o.totalAmount), 0);
  const cashRevenue = activeOrders
    .filter((o) => o.stripePaymentIntentId === null && o.paymentMethod !== "E_TRANSFER")
    .reduce((s, o) => s + Number(o.totalAmount), 0);
  const etransferRevenue = activeOrders
    .filter((o) => o.paymentMethod === "E_TRANSFER")
    .reduce((s, o) => s + Number(o.totalAmount), 0);

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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "販売枚数", value: `${totalSold} 枚` },
          { label: "売上", value: `$${grossRevenue.toFixed(2)}` },
          { label: "純利益", value: `$${netProfit.toFixed(2)}`, highlight: true },
          { label: "Stripe手数料", value: `-$${totalFees.toFixed(2)}`, sub: true },
          { label: "返金額", value: `-$${totalRefunds.toFixed(2)}`, sub: true },
          { label: "経費", value: `-$${totalExpenses.toFixed(2)}`, sub: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl border p-3 sm:p-4 ${stat.highlight ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-base sm:text-lg font-bold mt-0.5 ${stat.highlight ? "text-blue-700" : stat.sub ? "text-gray-500" : "text-gray-900"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* 売上内訳（支払方法別） */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">売上内訳</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "オンライン", value: onlineRevenue },
            { label: "現金", value: cashRevenue },
            { label: "e-transfer", value: etransferRevenue },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-base font-bold text-gray-900">${value.toFixed(2)}</p>
            </div>
          ))}
        </div>
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

      {/* 共有（オーナーのみ） */}
      {isOwner && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">共有メンバー</p>

          {event.collaborators.length > 0 && (
            <div className="flex flex-col gap-2">
              {event.collaborators.map((c) => (
                <div key={c.userId} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    {c.user.name && <p className="text-sm font-medium text-gray-800 truncate">{c.user.name}</p>}
                    <p className="text-xs text-gray-500 truncate">{c.user.email}</p>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await removeCollaborator(eventId, c.userId);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 shrink-0"
                    >
                      削除
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <CollaboratorForm eventId={eventId} />
        </div>
      )}
    </div>
  );
}
