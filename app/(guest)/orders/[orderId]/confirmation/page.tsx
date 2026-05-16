import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
    include: {
      event: true,
      orderItems: {
        include: {
          ticketType: true,
          tickets: true,
        },
      },
    },
  });
  if (!order) notFound();

  // QRコードのData URLを生成
  const ticketsWithQR = await Promise.all(
    order.orderItems.flatMap((item) =>
      item.tickets.map(async (ticket) => ({
        id: ticket.id,
        qrCode: ticket.qrCode,
        ticketTypeName: item.ticketType.name,
        qrDataUrl: await QRCode.toDataURL(ticket.qrCode, { width: 200, margin: 1 }),
        checkedInAt: ticket.checkedInAt,
      }))
    )
  );

  const startDate = order.event.startAt.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const startTime = order.event.startAt.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
        {/* 成功ヘッダー */}
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">You're going!</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your tickets have been sent to {order.buyerEmail}
          </p>
        </div>

        {/* イベント情報 */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <h2 className="font-bold text-gray-900 text-lg">{order.event.title}</h2>
          <p className="text-sm text-gray-600 mt-1">📅 {startDate}</p>
          <p className="text-sm text-gray-600">🕐 {startTime}</p>
          <p className="text-sm text-gray-600">📍 {order.event.location}</p>
          <p className="text-sm text-gray-500 mt-2">Hi, {order.buyerName}</p>
        </div>

        {/* QRチケット */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Your tickets ({ticketsWithQR.length})
          </h3>
          <div className="flex flex-col gap-4">
            {ticketsWithQR.map((ticket) => (
              <div
                key={ticket.id}
                className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-3 ${
                  ticket.checkedInAt ? "border-gray-200 opacity-60" : "border-blue-200"
                }`}
              >
                <p className="font-semibold text-gray-900">{ticket.ticketTypeName}</p>
                <img
                  src={ticket.qrDataUrl}
                  alt="QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
                <p className="text-xs text-gray-400 font-mono break-all text-center">
                  {ticket.qrCode}
                </p>
                {ticket.checkedInAt && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                    Checked in {ticket.checkedInAt.toLocaleString("en-CA")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 注文サマリー */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Order ID</span>
            <span className="font-mono text-xs">{order.id}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Total paid</span>
            <span className="font-semibold">${Number(order.totalAmount).toFixed(2)} CAD</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Show the QR code at the entrance. Each QR code is valid for one entry.
        </p>
      </div>
    </div>
  );
}
