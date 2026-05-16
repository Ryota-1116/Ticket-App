"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/signup";
import Link from "next/link";

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, {});

  if (state.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">確認メールを送信しました</h2>
          <p className="text-sm text-gray-500 mb-6">
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            ログイン画面へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🎟</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">アカウント作成</h1>
          <p className="text-sm text-gray-500 mt-1">招待コードが必要です</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              招待コード
            </label>
            <input
              name="inviteCode"
              type="text"
              required
              placeholder="XXXXXXXX"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-mono uppercase tracking-widest placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              メールアドレス
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              パスワード
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="8文字以上"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all mt-1"
          >
            登録する
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
