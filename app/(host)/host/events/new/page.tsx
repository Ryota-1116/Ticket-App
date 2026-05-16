"use client";

import { useActionState } from "react";
import { createEvent } from "@/app/actions/events";
import { Input, Textarea } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";
import Link from "next/link";

export default function NewEventPage() {
  const [state, formAction] = useActionState(createEvent, {});

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/host/events" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold text-gray-900">新規イベント作成</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <Input label="イベント名" name="title" required placeholder="例: サマーフェスティバル 2025" />
          <Textarea
            label="説明"
            name="description"
            required
            placeholder="イベントの詳細を入力してください"
          />
          <Input label="開催場所" name="location" required placeholder="例: 東京国際フォーラム" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="開始日時" name="startAt" type="datetime-local" required />
            <Input label="終了日時" name="endAt" type="datetime-local" required />
          </div>

          <Input label="画像URL（任意）" name="imageUrl" type="url" placeholder="https://example.com/image.jpg" />

          <div className="flex gap-3 mt-2">
            <Link
              href="/host/events"
              className="flex-1 text-center px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </Link>
            <SubmitButton className="flex-1">作成する</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
