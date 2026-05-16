"use client";

import { useActionState } from "react";
import { createRefund } from "@/app/actions/refunds";
import { Input } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";

export function RefundForm({
  orderId,
  maxRefundable,
}: {
  orderId: string;
  maxRefundable: number;
}) {
  const boundAction = createRefund.bind(null, orderId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 mt-3">
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-green-600">返金を処理しました</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          max={maxRefundable}
          required
          placeholder={`最大 $${maxRefundable.toFixed(2)}`}
          className="w-full sm:flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          name="reason"
          type="text"
          placeholder="理由（任意）"
          className="w-full sm:flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <SubmitButton size="sm" variant="danger" className="w-full sm:w-auto">返金</SubmitButton>
      </div>
    </form>
  );
}
