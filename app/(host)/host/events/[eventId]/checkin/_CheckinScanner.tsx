"use client";

import { useState, useCallback } from "react";
import { QrReader } from "react-qr-reader";
import { checkinByQrCode } from "@/app/actions/checkin";

type Result =
  | { success: true; attendeeName: string; ticketName: string }
  | { success: false; error: string }
  | null;

export function CheckinScanner({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<Result>(null);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleScan = useCallback(
    async (data: string | null) => {
      if (!data || processing) return;
      setProcessing(true);
      setScanning(false);
      const res = await checkinByQrCode(eventId, data);
      setResult(res);
      setProcessing(false);
    },
    [eventId, processing]
  );

  const reset = () => {
    setResult(null);
    setScanning(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {scanning ? (
        <div className="w-full max-w-sm">
          <div className="rounded-2xl overflow-hidden border-2 border-blue-200">
            <QrReader
              onResult={(result, error) => {
                if (result) handleScan(result.getText());
              }}
              constraints={{ facingMode: "environment" }}
              containerStyle={{ width: "100%" }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            カメラにQRコードをかざしてください
          </p>
        </div>
      ) : (
        <div className="w-full max-w-sm">
          {processing && (
            <div className="text-center py-8">
              <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
              <p className="mt-3 text-gray-500">確認中...</p>
            </div>
          )}

          {result && !processing && (
            <div
              className={`rounded-2xl border-2 p-6 text-center ${
                result.success
                  ? "border-green-400 bg-green-50"
                  : "border-red-400 bg-red-50"
              }`}
            >
              <div className="text-5xl mb-3">{result.success ? "✅" : "❌"}</div>
              {result.success ? (
                <>
                  <p className="text-xl font-bold text-green-700">{result.attendeeName}</p>
                  <p className="text-sm text-green-600 mt-1">{result.ticketName}</p>
                  <p className="text-sm text-green-600 mt-0.5">チェックイン完了</p>
                </>
              ) : (
                <p className="text-base font-semibold text-red-700">{result.error}</p>
              )}
            </div>
          )}

          <button
            onClick={reset}
            className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-95 transition-all"
          >
            次のQRコードをスキャン
          </button>
        </div>
      )}
    </div>
  );
}
