"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { checkinByQrCode } from "@/app/actions/checkin";

type ScanResult =
  | { success: true; attendeeName: string; ticketName: string }
  | { success: false; error: string }
  | null;

export function CheckinScanner({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<ScanResult>(null);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const scannedRef = useRef(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleScan = useCallback(
    async (data: string) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      setScanning(false);
      setProcessing(true);
      stopCamera();
      const res = await checkinByQrCode(eventId, data);
      setResult(res);
      setProcessing(false);
    },
    [eventId, stopCamera]
  );

  useEffect(() => {
    if (!scanning) return;

    scannedRef.current = false;
    let active = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();

        const jsQR = (await import("jsqr")).default;

        const tick = () => {
          if (!active) return;
          const v = videoRef.current;
          const c = canvasRef.current;
          if (!v || !c) return;

          if (v.readyState === v.HAVE_ENOUGH_DATA) {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext("2d");
            if (ctx) {
              ctx.drawImage(v, 0, 0);
              const imageData = ctx.getImageData(0, 0, c.width, c.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code) {
                handleScan(code.data);
                return;
              }
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (active) setCameraError("カメラを起動できませんでした");
      }
    })();

    return () => {
      active = false;
      stopCamera();
    };
  }, [scanning, handleScan, stopCamera]);

  const reset = () => {
    setResult(null);
    setCameraError(null);
    setScanning(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {scanning ? (
        <div className="w-full max-w-sm">
          {cameraError ? (
            <div className="text-center py-8 text-red-500 text-sm">{cameraError}</div>
          ) : (
            <div className="rounded-2xl overflow-hidden border-2 border-blue-200 bg-black aspect-square">
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
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
