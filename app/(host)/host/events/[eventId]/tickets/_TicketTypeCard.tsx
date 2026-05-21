"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { updateTicketType } from "@/app/actions/tickets";
import { Input, Textarea } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";
import { DeleteButton } from "@/app/_components/ui/DeleteButton";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number | null;
  remaining: number | null;
  sold: number;
  salesStartAt: string | null;
  salesEndAt: string | null;
};

export function TicketTypeCard({
  eventId,
  ticketType,
  deleteAction,
}: {
  eventId: string;
  ticketType: TicketType;
  deleteAction: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(
    updateTicketType.bind(null, eventId, ticketType.id),
    {}
  );

  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state.success]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{ticketType.name}</p>
          {ticketType.description && (
            <p className="text-sm text-gray-500 mt-0.5">{ticketType.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
            <span>${ticketType.price}</span>
            {ticketType.quantity !== null
              ? <span>残り {ticketType.remaining} / {ticketType.quantity} 枚</span>
              : <span>{ticketType.sold} 枚販売済み（上限なし）</span>
            }
            {ticketType.salesStartAt && (
              <span>
                販売期間: {new Date(ticketType.salesStartAt).toLocaleDateString("ja-JP")} 〜{" "}
                {ticketType.salesEndAt ? new Date(ticketType.salesEndAt).toLocaleDateString("ja-JP") : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
          <Input label="チケット名" name="name" required defaultValue={ticketType.name} />
          <Textarea label="説明（任意）" name="description" rows={2} defaultValue={ticketType.description ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="価格 (CAD)" name="price" type="number" min="0" step="0.01" required defaultValue={ticketType.price} />
            <Input label="販売枚数（任意）" name="quantity" type="number" min={ticketType.sold} placeholder="空欄で無制限" defaultValue={ticketType.quantity != null ? String(ticketType.quantity) : ""} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="販売開始（任意）" name="salesStartAt" type="datetime-local" defaultValue={ticketType.salesStartAt ?? ""} />
            <Input label="販売終了（任意）" name="salesEndAt" type="datetime-local" defaultValue={ticketType.salesEndAt ?? ""} />
          </div>
          <SubmitButton size="sm" className="w-full">保存する</SubmitButton>
        </form>
      )}
    </div>
  );
}
