import { requireAuth } from "@/lib/auth";
import { requireEventAccess } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { CheckinScanner } from "./_CheckinScanner";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;

  await requireEventAccess(eventId, user.id);

  const [totalTickets, checkedIn] = await Promise.all([
    prisma.ticket.count({
      where: {
        orderItem: {
          order: { eventId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
        },
      },
    }),
    prisma.ticket.count({
      where: {
        checkedInAt: { not: null },
        orderItem: {
          order: { eventId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
        },
      },
    }),
  ]);

  return (
    <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">チェックイン</h2>
        <p className="text-sm text-gray-500">
          {checkedIn} / {totalTickets}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-2 bg-gray-100">
          <div
            className="h-2 bg-blue-600 transition-all"
            style={{ width: totalTickets > 0 ? `${(checkedIn / totalTickets) * 100}%` : "0%" }}
          />
        </div>
        <p className="text-center text-sm text-gray-500 py-2">
          {totalTickets > 0
            ? `${Math.round((checkedIn / totalTickets) * 100)}% 完了`
            : "まだチェックイン可能なチケットはありません"}
        </p>
      </div>

      <CheckinScanner eventId={eventId} />
    </div>
  );
}
