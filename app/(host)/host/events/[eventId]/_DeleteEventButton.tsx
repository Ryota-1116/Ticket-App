"use client";

import { deleteEvent } from "@/app/actions/events";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("このイベントを削除しますか？この操作は取り消せません。")) return;
    startTransition(async () => {
      await deleteEvent(eventId);
      router.push("/host/events");
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "削除中…" : "🗑 削除"}
    </button>
  );
}
