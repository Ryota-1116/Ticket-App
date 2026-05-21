import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PurchaseForm } from "./_PurchaseForm";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, status: "PUBLISHED" },
    include: {
      ticketTypes: { orderBy: { price: "asc" } },
      promoCodes: { select: { id: true } },
    },
  });
  if (!event) notFound();

  const now = new Date();

  const ticketTypesWithRemaining = await Promise.all(
    event.ticketTypes.map(async (tt) => {
      const sold = await prisma.orderItem.aggregate({
        where: {
          ticketTypeId: tt.id,
          order: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
        },
        _sum: { quantity: true },
      });
      const remaining = tt.quantity !== null ? tt.quantity - (sold._sum.quantity ?? 0) : null;
      return {
        id: tt.id,
        name: tt.name,
        description: tt.description,
        price: tt.price.toFixed(2),
        quantity: tt.quantity,
        remaining,
        salesStartAt: tt.salesStartAt?.toISOString() ?? null,
        salesEndAt: tt.salesEndAt?.toISOString() ?? null,
      };
    })
  );

  const startDate = event.startAt.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const startTime = event.startAt.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = event.endAt.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div
        className="text-white px-4 pt-12 pb-10 relative"
        style={
          event.imageUrl
            ? { backgroundImage: `url(${event.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { backgroundColor: "#111827" }
        }
      >
        {event.imageUrl && (
          <div className="absolute inset-0 bg-black/60" />
        )}
        <div className="max-w-2xl mx-auto relative">
          <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
            Event
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-col gap-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">📅</span>
              <span>{startDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">🕐</span>
              <span>{startTime} – {endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">📍</span>
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* About */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            About this event
          </h2>
          <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
            {event.description}
          </p>
        </section>

        {/* Tickets */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Tickets
          </h2>
          <PurchaseForm
            eventId={eventId}
            ticketTypes={ticketTypesWithRemaining}
            hasPrivacyPolicy={!!event.privacyPolicy}
            hasPromoCodes={event.promoCodes.length > 0}
          />
        </section>

        {/* Privacy Policy */}
        {event.privacyPolicy && (
          <section>
            <details className="group">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 list-none flex items-center gap-1.5 select-none">
                <span className="transition-transform group-open:rotate-90">▶</span>
                Privacy Policy
              </summary>
              <div className="mt-3 text-xs text-gray-500 whitespace-pre-line leading-relaxed bg-white border border-gray-200 rounded-xl p-4">
                {event.privacyPolicy}
              </div>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
