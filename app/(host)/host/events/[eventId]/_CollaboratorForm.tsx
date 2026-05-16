"use client";

import { useActionState } from "react";
import { addCollaborator } from "@/app/actions/collaborators";

export function CollaboratorForm({ eventId }: { eventId: string }) {
  const boundAction = addCollaborator.bind(null, eventId);
  const [state, formAction] = useActionState(boundAction, {});

  return (
    <div className="flex flex-col gap-2">
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-green-600">追加しました</p>
      )}
      <form action={formAction} className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="メールアドレスで追加"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
        />
        <button
          type="submit"
          className="shrink-0 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          追加
        </button>
      </form>
    </div>
  );
}
