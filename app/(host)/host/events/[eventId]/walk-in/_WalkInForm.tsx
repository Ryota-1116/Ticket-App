"use client";

import { useState, useEffect, useActionState } from "react";
import { createWalkInOrder } from "@/app/actions/walk-in";
import { Input } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";

type TicketType = {
  id: string;
  name: string;
  price: string;
  remaining: number;
};

export function WalkInForm({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketType[];
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((tt) => [tt.id, 0]))
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const boundAction = createWalkInOrder.bind(null, eventId, quantities);
  const [state, formAction] = useActionState(boundAction, {});

  useEffect(() => {
    if (state.success && state.buyerName) {
      setSuccessMsg(`${state.buyerName} さんを登録しました`);
      setQuantities(Object.fromEntries(ticketTypes.map((tt) => [tt.id, 0])));
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success, state.buyerName, ticketTypes]);

  const adjust = (id: string, delta: number, max: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(max, Math.max(0, (prev[id] ?? 0) + delta)),
    }));
  };

  const totalAmount = ticketTypes.reduce((sum, tt) => {
    return sum + (quantities[tt.id] ?? 0) * parseFloat(tt.price);
  }, 0);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {successMsg && (
        <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          ✅ {successMsg}
        </div>
      )}
      {state.error && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Input label="氏名" name="buyerName" required placeholder="山田 太郎" />
        <Input
          label="メールアドレス（任意）"
          name="buyerEmail"
          type="email"
          placeholder="省略可"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">チケット</p>
        <div className="flex flex-col gap-2">
          {ticketTypes.map((tt) => {
            const qty = quantities[tt.id] ?? 0;
            const soldOut = tt.remaining === 0;
            return (
              <div
                key={tt.id}
                className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tt.name}</p>
                  <p className="text-xs text-gray-500">
                    ${tt.price}
                    {soldOut ? (
                      <span className="ml-2 text-red-500">在庫なし</span>
                    ) : (
                      <span className="ml-2 text-gray-400">残り {tt.remaining} 枚</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjust(tt.id, -1, tt.remaining)}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 text-lg leading-none flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-gray-900">{qty}</span>
                  <button
                    type="button"
                    onClick={() => adjust(tt.id, 1, tt.remaining)}
                    disabled={soldOut || qty >= tt.remaining}
                    className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 text-lg leading-none flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                  >
                    ＋
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalAmount > 0 && (
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="text-gray-600">合計（現金受取額）</span>
          <span className="text-lg font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
        </div>
      )}

      <SubmitButton className="w-full">登録する</SubmitButton>
    </form>
  );
}
