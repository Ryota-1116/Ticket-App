import { requireAuth } from "@/lib/auth";
import { requireEventAccess } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { deleteExpense } from "@/app/actions/expenses";
import { ExpenseForm } from "./_ExpenseForm";
import { ExpenseCard } from "./_ExpenseCard";
import { Pagination } from "@/app/_components/ui/Pagination";

const PAGE_SIZE = 10;
const MEMBERS = ["そうすけ", "しんたろう", "りょうた"];

export default async function ExpensesPage({
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

  await requireEventAccess(eventId, user.id);

  const where = { eventId };

  const [totalCount, aggregate, expenses, byPerson] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.expense.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.expense.groupBy({
      by: ["paidBy"],
      where,
      _sum: { amount: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const total = Number(aggregate._sum.amount ?? 0);

  const summaryMap = Object.fromEntries(
    byPerson.map((r) => [r.paidBy ?? "", Number(r._sum.amount ?? 0)])
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">経費管理</h2>
        <p className="text-sm font-semibold text-gray-700">合計 ${total.toFixed(2)}</p>
      </div>

      {/* 支払者サマリー */}
      {total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">支払者別サマリー</p>
          <div className="grid grid-cols-3 gap-3">
            {MEMBERS.map((name) => (
              <div key={name} className="text-center">
                <p className="text-xs text-gray-500 mb-1">{name}</p>
                <p className="text-base font-bold text-gray-900">
                  ${(summaryMap[name] ?? 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          {summaryMap[""] > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              未設定: ${summaryMap[""].toFixed(2)}
            </p>
          )}
        </div>
      )}

      {totalCount > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {expenses.map((expense) => {
              const deleteAction = async () => {
                "use server";
                await deleteExpense(eventId, expense.id);
              };
              return (
                <ExpenseCard
                  key={expense.id}
                  eventId={eventId}
                  expense={{
                    id: expense.id,
                    description: expense.description,
                    amount: Number(expense.amount).toFixed(2),
                    occurredAt: expense.occurredAt.toISOString().slice(0, 10),
                    paidBy: expense.paidBy,
                  }}
                  deleteAction={deleteAction}
                />
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={`/host/events/${eventId}/expenses`}
          />
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">経費を追加</p>
        <ExpenseForm eventId={eventId} />
      </div>
    </div>
  );
}
