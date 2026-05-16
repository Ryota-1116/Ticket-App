"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireEventOwner, requireEventAccess } from "@/lib/event-access";
import { generatePrivacyPolicy } from "@/lib/privacy-policy";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type EventState = { error?: string; success?: boolean };

const EventSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().min(1, "説明を入力してください"),
  location: z.string().min(1, "場所を入力してください"),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  imageUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url("有効なURLを入力してください").optional()
  ),
});

export async function createEvent(
  _prev: EventState,
  formData: FormData
): Promise<EventState> {
  const user = await requireAuth();

  const parsed = EventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { title, description, location, startAt, endAt, imageUrl } = parsed.data;

  const [event, otherProfiles] = await Promise.all([
    prisma.event.create({
      data: {
        hostId: user.id,
        title,
        description,
        location,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        imageUrl: imageUrl ?? null,
        privacyPolicy: generatePrivacyPolicy("", title),
        status: "DRAFT",
      },
    }),
    prisma.profile.findMany({
      where: { id: { not: user.id } },
      select: { id: true },
    }),
  ]);

  if (otherProfiles.length > 0) {
    await prisma.eventCollaborator.createMany({
      data: otherProfiles.map((p) => ({ eventId: event.id, userId: p.id })),
      skipDuplicates: true,
    });
  }

  redirect(`/host/events/${event.id}`);
}

export async function updateEvent(
  eventId: string,
  _prev: EventState,
  formData: FormData
): Promise<EventState> {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);

  const parsed = EventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { title, description, location, startAt, endAt, imageUrl } = parsed.data;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      location,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      imageUrl: imageUrl ?? null,
    },
  });

  revalidatePath(`/host/events/${eventId}`);
  revalidatePath(`/host/events/${eventId}/edit`);
  return { success: true };
}

export async function publishEvent(eventId: string) {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);
  await prisma.event.update({
    where: { id: eventId },
    data: { status: "PUBLISHED" },
  });
  revalidatePath(`/host/events/${eventId}`);
}

export async function unpublishEvent(eventId: string) {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);
  await prisma.event.update({
    where: { id: eventId },
    data: { status: "DRAFT" },
  });
  revalidatePath(`/host/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const user = await requireAuth();
  await requireEventAccess(eventId, user.id);
  await prisma.event.delete({ where: { id: eventId } });
  redirect("/host/events");
}
