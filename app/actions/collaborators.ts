"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireEventOwner } from "@/lib/event-access";
import { revalidatePath } from "next/cache";

export type CollaboratorState = { error?: string; success?: boolean };

export async function addCollaborator(
  eventId: string,
  _prev: CollaboratorState,
  formData: FormData
): Promise<CollaboratorState> {
  const user = await requireAuth();
  await requireEventOwner(eventId, user.id);

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "メールアドレスを入力してください" };

  const target = await prisma.profile.findUnique({ where: { email } });
  if (!target) return { error: "そのメールアドレスのユーザーが見つかりません" };
  if (target.id === user.id) return { error: "自分自身は追加できません" };

  const existing = await prisma.eventCollaborator.findUnique({
    where: { eventId_userId: { eventId, userId: target.id } },
  });
  if (existing) return { error: "すでに追加済みです" };

  await prisma.eventCollaborator.create({
    data: { eventId, userId: target.id },
  });

  revalidatePath(`/host/events/${eventId}`);
  return { success: true };
}

export async function removeCollaborator(eventId: string, userId: string) {
  const user = await requireAuth();
  await requireEventOwner(eventId, user.id);

  await prisma.eventCollaborator.delete({
    where: { eventId_userId: { eventId, userId } },
  });

  revalidatePath(`/host/events/${eventId}`);
}
