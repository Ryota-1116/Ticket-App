"use client";

import { useActionState } from "react";
import { createTicketType } from "@/app/actions/tickets";
import { Input, Textarea } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";

export function TicketTypeForm({ eventId }: { eventId: string }) {
  const boundAction = createTicketType.bind(null, eventId);
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

      <Input label="チケット名" name="name" required placeholder="例: 一般チケット" />
      <Textarea label="説明（任意）" name="description" rows={2} placeholder="例: 全席自由" />

      <div className="grid grid-cols-2 gap-3">
        <Input label="価格 (CAD)" name="price" type="number" min="0" step="0.01" required placeholder="0.00" />
        <Input label="販売枚数" name="quantity" type="number" min="1" required placeholder="100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="販売開始（任意）" name="salesStartAt" type="datetime-local" />
        <Input label="販売終了（任意）" name="salesEndAt" type="datetime-local" />
      </div>

      <SubmitButton className="w-full">追加する</SubmitButton>
    </form>
  );
}
