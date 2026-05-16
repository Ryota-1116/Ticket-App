import { prisma } from "@/lib/prisma";
import { type Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

function accessOR(userId: string): Prisma.EventWhereInput[] {
  return [
    { hostId: userId },
    { collaborators: { some: { userId } } },
  ];
}

export async function requireEventAccess(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, OR: accessOR(userId) },
  });
  if (!event) redirect("/host/events");
  return event;
}

export async function requireEventOwner(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, hostId: userId },
  });
  if (!event) redirect("/host/events");
  return event;
}

export function eventAccessFilter(userId: string): Prisma.EventWhereInput {
  return { OR: accessOR(userId) };
}

export function eventAccessWhere(eventId: string, userId: string): Prisma.EventWhereInput {
  return { id: eventId, OR: accessOR(userId) };
}
