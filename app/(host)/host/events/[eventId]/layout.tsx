import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EventSubNav } from "@/app/_components/HostNav";
import { eventAccessFilter } from "@/lib/event-access";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireAuth();
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, ...eventAccessFilter(user.id) },
    select: { id: true, title: true },
  });
  if (!event) redirect("/host/events");

  return (
    <div className="min-h-screen flex flex-col">
      <EventSubNav eventId={event.id} eventTitle={event.title} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
