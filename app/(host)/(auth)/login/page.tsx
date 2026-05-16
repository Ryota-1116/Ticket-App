"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Input } from "@/app/_components/ui/Input";
import { SubmitButton } from "@/app/_components/ui/Button";
import Link from "next/link";

export default function LoginPage() {
  const [state, formAction] = useActionState(login, {});

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🎟</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">チケット管理</h1>
          <p className="mt-1 text-sm text-gray-500">ホスト用ログイン</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form action={formAction} className="flex flex-col gap-4">
            {state.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}
            <Input
              label="メールアドレス"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="host@example.com"
            />
            <Input
              label="パスワード"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
            <SubmitButton className="w-full mt-2" size="lg">
              ログイン
            </SubmitButton>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-blue-600 hover:underline font-medium">
            新規登録
          </Link>
        </p>
      </div>
    </main>
  );
}
