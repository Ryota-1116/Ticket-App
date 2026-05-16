import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type OrderStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { deletePromoCode } from "@/app/actions/promo-codes";
import { PromoCodeForm } from "./_PromoCodeForm";
import { PromoCodeCard } from "./_PromoCodeCard";
import { Pagination } from "@/app/_components/ui/Pagination";

const PAGE_SIZE = 10;

function toDatetimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function PromoCodesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const event = await prisma.event.findFirst({
    where: { id: eventId, hostId: user.id },
  });
  if (!event) redirect("/host/events");

  const where = { eventId };

  const [totalCount, promoCodesRaw] = await Promise.all([
    prisma.promoCode.count({ where }),
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const promoCodes = await Promise.all(
    promoCodesRaw.map(async (pc) => {
      const agg = await prisma.orderItem.aggregate({
        where: {
          order: {
            promoCodeId: pc.id,
            status: { in: ["PAID", "PARTIALLY_REFUNDED"] as OrderStatus[] },
          },
        },
        _sum: { quantity: true },
      });
      return { ...pc, ticketCount: agg._sum.quantity ?? 0 };
    })
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <h2 className="text-lg font-bold text-gray-900">プロモーションコード</h2>

      {totalCount > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {promoCodes.map((pc) => {
              const deleteAction = async () => {
                "use server";
                await deletePromoCode(eventId, pc.id);
              };
              return (
                <PromoCodeCard
                  key={pc.id}
                  eventId={eventId}
                  promoCode={{
                    id: pc.id,
                    code: pc.code,
                    discountType: pc.discountType,
                    discountValue: Number(pc.discountValue).toString(),
                    maxUses: pc.maxUses,
                    usedCount: pc.usedCount,
                    ticketCount: pc.ticketCount,
                    validFrom: pc.validFrom ? toDatetimeLocal(pc.validFrom) : null,
                    validUntil: pc.validUntil ? toDatetimeLocal(pc.validUntil) : null,
                  }}
                  deleteAction={deleteAction}
                />
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={`/host/events/${eventId}/promo-codes`}
          />
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">コードを追加</p>
        <PromoCodeForm eventId={eventId} />
      </div>
    </div>
  );
}
