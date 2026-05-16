"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { updatePromoCode } from "@/app/actions/promo-codes";
import { Input, Select } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";
import { DeleteButton } from "@/app/_components/ui/DeleteButton";

type PromoCode = {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
};

export function PromoCodeCard({
  eventId,
  promoCode,
  deleteAction,
}: {
  eventId: string;
  promoCode: PromoCode;
  deleteAction: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [discountType, setDiscountType] = useState(promoCode.discountType);
  const [state, formAction] = useActionState(
    updatePromoCode.bind(null, eventId, promoCode.id),
    {}
  );

  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state.success]);

  const onEditOpen = () => {
    setDiscountType(promoCode.discountType);
    setEditing(true);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono font-semibold text-gray-900">{promoCode.code}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {promoCode.discountType === "PERCENTAGE"
              ? `${promoCode.discountValue}% OFF`
              : `$${promoCode.discountValue} OFF`}
            {promoCode.maxUses !== null && ` · ${promoCode.usedCount}/${promoCode.maxUses} 使用`}
            {promoCode.maxUses === null && ` · ${promoCode.usedCount} 回使用`}
          </p>
          {(promoCode.validFrom || promoCode.validUntil) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {promoCode.validFrom
                ? new Date(promoCode.validFrom).toLocaleDateString("ja-JP")
                : ""}{" "}
              〜{" "}
              {promoCode.validUntil
                ? new Date(promoCode.validUntil).toLocaleDateString("ja-JP")
                : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => (editing ? setEditing(false) : onEditOpen())}
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
          <Input
            label="コード"
            name="code"
            required
            defaultValue={promoCode.code}
            className="uppercase"
          />
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
              defaultValue={promoCode.discountValue}
            />
          </div>
          <Input
            label="最大使用回数（任意・空欄=無制限）"
            name="maxUses"
            type="number"
            min="1"
            defaultValue={promoCode.maxUses !== null ? String(promoCode.maxUses) : ""}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="有効開始（任意）"
              name="validFrom"
              type="datetime-local"
              defaultValue={promoCode.validFrom ?? ""}
            />
            <Input
              label="有効終了（任意）"
              name="validUntil"
              type="datetime-local"
              defaultValue={promoCode.validUntil ?? ""}
            />
          </div>
          <SubmitButton size="sm" className="w-full">保存する</SubmitButton>
        </form>
      )}
    </div>
  );
}
