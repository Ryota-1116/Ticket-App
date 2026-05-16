"use client";

import { useActionState } from "react";
import { createPromoCode } from "@/app/actions/promo-codes";
import { Input, Select } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";
import { useState } from "react";

export function PromoCodeForm({ eventId }: { eventId: string }) {
  const boundAction = createPromoCode.bind(null, eventId);
  const [state, formAction, pending] = useActionState(boundAction, {});
  const [discountType, setDiscountType] = useState("PERCENTAGE");

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

      <Input label="コード" name="code" required placeholder="例: SUMMER20" />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="割引タイプ"
          name="discountType"
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value)}
          options={[
            { value: "PERCENTAGE", label: "割合 (%)" },
            { value: "FIXED", label: "固定額 ($)" },
          ]}
        />
        <Input
          label={discountType === "PERCENTAGE" ? "割引率 (%)" : "割引額 ($)"}
          name="discountValue"
          type="number"
          min="0.01"
          step={discountType === "PERCENTAGE" ? "1" : "0.01"}
          max={discountType === "PERCENTAGE" ? "100" : undefined}
          required
          placeholder={discountType === "PERCENTAGE" ? "20" : "5.00"}
        />
      </div>

      <Input label="最大使用回数（任意・空欄=無制限）" name="maxUses" type="number" min="1" placeholder="100" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="有効開始（任意）" name="validFrom" type="datetime-local" />
        <Input label="有効終了（任意）" name="validUntil" type="datetime-local" />
      </div>

      <SubmitButton className="w-full">追加する</SubmitButton>
    </form>
  );
}
