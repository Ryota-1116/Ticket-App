"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession } from "@/app/actions/purchase";
import { useRouter } from "next/navigation";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
  remaining: number;
  salesStartAt: string | null;
  salesEndAt: string | null;
};

export function PurchaseForm({
  eventId,
  ticketTypes,
  hasPrivacyPolicy,
  hasPromoCodes,
}: {
  eventId: string;
  ticketTypes: TicketType[];
  hasPrivacyPolicy: boolean;
  hasPromoCodes: boolean;
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((t) => [t.id, 0]))
  );
  const [promoCode, setPromoCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const subtotal = ticketTypes.reduce(
    (s, t) => s + parseFloat(t.price) * (quantities[t.id] ?? 0),
    0
  );
  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (totalItems === 0) {
      setError("Please select at least one ticket.");
      return;
    }

    const buyerName = (form.elements.namedItem("buyerName") as HTMLInputElement)?.value?.trim();
    const buyerEmail = (form.elements.namedItem("buyerEmail") as HTMLInputElement)?.value?.trim();

    if (!buyerName) {
      setError("Please enter your full name.");
      return;
    }
    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    const formData = new FormData(form);
    startTransition(async () => {
      const res = await createCheckoutSession(eventId, quantities, {}, formData);
      if (res.error) {
        setError(res.error);
      } else if (res.sessionUrl) {
        router.push(res.sessionUrl);
      }
    });
  };

  const now = new Date();

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Ticket selection */}
      <div className="flex flex-col gap-3">
        {ticketTypes.map((tt) => {
          const salesStarted = !tt.salesStartAt || new Date(tt.salesStartAt) <= now;
          const salesEnded = tt.salesEndAt && new Date(tt.salesEndAt) < now;
          const isSoldOut = tt.remaining === 0;
          const disabled = !salesStarted || !!salesEnded || isSoldOut;
          const qty = quantities[tt.id] ?? 0;

          return (
            <div
              key={tt.id}
              className={`rounded-xl border p-4 transition-colors ${
                disabled
                  ? "border-gray-200 bg-gray-50 opacity-60"
                  : qty > 0
                  ? "border-blue-300 bg-blue-50/40"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* 名前・説明 — 常にフル幅 */}
              <p className="font-semibold text-gray-900 text-sm leading-snug">{tt.name}</p>
              {tt.description && (
                <p className="text-xs text-gray-500 mt-0.5">{tt.description}</p>
              )}

              {/* 価格・ステータス・数量ボタン */}
              <div className="flex items-center justify-between mt-2.5 gap-2">
                <div>
                  <span className="text-sm font-bold text-gray-900">
                    {parseFloat(tt.price) === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `$${parseFloat(tt.price).toFixed(2)}`
                    )}
                  </span>
                  {isSoldOut && (
                    <span className="ml-2 text-xs text-red-500 font-medium">Sold out</span>
                  )}
                  {salesEnded && !isSoldOut && (
                    <span className="ml-2 text-xs text-gray-400">Sales ended</span>
                  )}
                  {!salesStarted && (
                    <span className="ml-2 text-xs text-gray-400">
                      On sale {new Date(tt.salesStartAt!).toLocaleDateString("en-CA")}
                    </span>
                  )}
                </div>

                {!disabled && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [tt.id]: Math.max(0, (q[tt.id] ?? 0) - 1),
                        }))
                      }
                      disabled={qty === 0}
                      className="size-8 rounded-full border-2 border-gray-300 text-gray-600 flex items-center justify-center hover:border-gray-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base leading-none"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-bold text-gray-900 text-sm tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [tt.id]: Math.min(tt.remaining, (q[tt.id] ?? 0) + 1),
                        }))
                      }
                      disabled={qty >= tt.remaining}
                      className="size-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base leading-none"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtotal */}
      {totalItems > 0 && (
        <div className="rounded-xl bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-300">
            {totalItems} ticket{totalItems > 1 ? "s" : ""}
          </span>
          <span className="font-bold text-base">${subtotal.toFixed(2)}</span>
        </div>
      )}

      {/* Promo code — only when host has set up codes */}
      {hasPromoCodes && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
            Promo code
          </label>
          <input
            name="promoCode"
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-mono uppercase tracking-wider placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          />
        </div>
      )}

      {/* Buyer info */}
      {totalItems > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Your information
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full name</label>
            <input
              name="buyerName"
              type="text"
              placeholder="Jane Smith"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email address</label>
            <input
              name="buyerEmail"
              type="email"
              placeholder="jane@example.com"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Privacy notice */}
      {hasPrivacyPolicy && totalItems > 0 && (
        <p className="text-xs text-gray-400 text-center">
          By purchasing, you agree to the event's privacy policy.
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={totalItems === 0 || isPending}
        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        {isPending ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Redirecting to checkout…
          </>
        ) : totalItems > 0 ? (
          `Checkout · $${subtotal.toFixed(2)} CAD`
        ) : (
          "Select tickets to continue"
        )}
      </button>
    </form>
  );
}
