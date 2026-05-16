"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { updateExpense } from "@/app/actions/expenses";
import { Input } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";
import { DeleteButton } from "@/app/_components/ui/DeleteButton";

type Expense = {
  id: string;
  description: string;
  amount: string;
  occurredAt: string;
};

export function ExpenseCard({
  eventId,
  expense,
  deleteAction,
}: {
  eventId: string;
  expense: Expense;
  deleteAction: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(
    updateExpense.bind(null, eventId, expense.id),
    {}
  );

  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state.success]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">{expense.occurredAt}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-gray-900">${expense.amount}</span>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-sm text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            {editing ? "キャンセル" : "編集"}
          </button>
          <form action={deleteAction}>
            <DeleteButton />
          </form>
        </div>
      </div>

      {editing && (
        <form action={formAction} className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
          {state.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
          <Input label="説明" name="description" required defaultValue={expense.description} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="金額 (CAD)" name="amount" type="number" min="0.01" step="0.01" required defaultValue={expense.amount} />
            <Input label="発生日" name="occurredAt" type="date" required defaultValue={expense.occurredAt} />
          </div>
          <SubmitButton size="sm" className="w-full">保存する</SubmitButton>
        </form>
      )}
    </div>
  );
}
