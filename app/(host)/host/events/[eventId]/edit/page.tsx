import { requireAuth } from "@/lib/auth";
import { eventAccessWhere } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EditEventForm } from "./_EditEventForm";
import Link from "next/link";

function toLocalDatetime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: eventAccessWhere(eventId, user.id),
  });
  if (!event) redirect("/host/events");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/host/events/${eventId}`} className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold text-gray-900">イベント編集</h1>
      </div>

      <EditEventForm
        eventId={eventId}
        defaultValues={{
          title: event.title,
          description: event.description,
          location: event.location,
          startAt: toLocalDatetime(event.startAt),
          endAt: toLocalDatetime(event.endAt),
          imageUrl: event.imageUrl,
        }}
      />
    </div>
  );
}
