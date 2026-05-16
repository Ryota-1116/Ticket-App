"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton({ label = "削除" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "削除中..." : label}
    </button>
  );
}
