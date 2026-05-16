"use client";

import { useEffect } from "react";

export default function HostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <h2 className="text-lg font-bold text-gray-900 mb-2">エラーが発生しました</h2>
      <p className="text-sm text-gray-500 mb-6">
        ページの読み込み中に問題が発生しました。もう一度お試しください。
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        再試行
      </button>
    </div>
  );
}
