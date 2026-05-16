import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { deleteExpense } from "@/app/actions/expenses";
import { ExpenseForm } from "./_ExpenseForm";
import { ExpenseCard } from "./_ExpenseCard";
import { Pagination } from "@/app/_components/ui/Pagination";

const PAGE_SIZE = 10;

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

  const event = await prisma.event.findFirst({
    where: { id: eventId, hostId: user.id },
  });
  if (!event) redirect("/host/events");

  const where = { eventId };

  const [totalCount, aggregate, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.expense.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const total = Number(aggregate._sum.amount ?? 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">経費管理</h2>
        <p className="text-sm font-semibold text-gray-700">合計 ${total.toFixed(2)}</p>
      </div>

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
