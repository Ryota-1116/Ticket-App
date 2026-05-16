"use client";

import { useActionState } from "react";
import { createExpense } from "@/app/actions/expenses";
import { Input } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";

export function ExpenseForm({ eventId }: { eventId: string }) {
  const boundAction = createExpense.bind(null, eventId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          追加しました
        </div>
      )}
      <Input label="説明" name="description" required placeholder="例: 会場レンタル費" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="金額 (CAD)" name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" />
        <Input label="発生日" name="occurredAt" type="date" required />
      </div>
      <SubmitButton className="w-full">追加する</SubmitButton>
    </form>
  );
}
