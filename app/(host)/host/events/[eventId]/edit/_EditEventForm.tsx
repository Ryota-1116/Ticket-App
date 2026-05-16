"use client";

import { useActionState } from "react";
import { updateEvent } from "@/app/actions/events";
import { Input, Textarea } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";

type DefaultValues = {
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  imageUrl: string | null;
};

export function EditEventForm({
  eventId,
  defaultValues,
}: {
  eventId: string;
  defaultValues: DefaultValues;
}) {
  const boundAction = updateEvent.bind(null, eventId);
  const [state, formAction] = useActionState(boundAction, {});

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <form action={formAction} className="flex flex-col gap-4">
        {state.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            保存しました
          </div>
        )}

        <Input label="イベント名" name="title" required defaultValue={defaultValues.title} />
        <Textarea label="説明" name="description" required defaultValue={defaultValues.description} rows={4} />
        <Input label="開催場所" name="location" required defaultValue={defaultValues.location} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="開始日時" name="startAt" type="datetime-local" required defaultValue={defaultValues.startAt} />
          <Input label="終了日時" name="endAt" type="datetime-local" required defaultValue={defaultValues.endAt} />
        </div>

        <Input label="画像URL（任意）" name="imageUrl" type="url" placeholder="https://example.com/image.jpg" defaultValue={defaultValues.imageUrl ?? ""} />

        <SubmitButton className="w-full mt-2">保存する</SubmitButton>
      </form>
    </div>
  );
}
