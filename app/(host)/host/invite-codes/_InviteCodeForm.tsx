"use client";

import { useActionState } from "react";
import { createInviteCode } from "@/app/actions/invite-codes";
import { SubmitButton } from "@/app/_components/ui/Button";

export function InviteCodeForm() {
  const [state, formAction] = useActionState(createInviteCode, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          コードを発行しました
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          コード（空欄でランダム生成）
        </label>
        <input
          name="code"
          type="text"
          placeholder="例: FRIEND2025"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono uppercase tracking-wider placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          最大使用回数（空欄で無制限）
        </label>
        <input
          name="maxUses"
          type="number"
          min="1"
          placeholder="例: 1"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <SubmitButton className="w-full">発行する</SubmitButton>
    </form>
  );
}
