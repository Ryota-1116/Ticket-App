"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";

export type InviteCodeState = { error?: string; success?: boolean };

const InviteCodeSchema = z.object({
  code: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(4, "コードは4文字以上にしてください").optional()
  ),
  maxUses: z.string().optional(),
});

export async function createInviteCode(
  _prev: InviteCodeState,
  formData: FormData
): Promise<InviteCodeState> {
  await requireAuth();

  const parsed = InviteCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const code = parsed.data.code?.trim().toUpperCase() ||
    randomBytes(4).toString("hex").toUpperCase();
  const maxUses = parsed.data.maxUses ? parseInt(parsed.data.maxUses) : null;

  const existing = await prisma.inviteCode.findUnique({ where: { code } });
  if (existing) return { error: "このコードはすでに存在します" };

  await prisma.inviteCode.create({
    data: { code, maxUses: maxUses && maxUses > 0 ? maxUses : null },
  });

  revalidatePath("/host/invite-codes");
  return { success: true };
}

export async function deleteInviteCode(id: string) {
  await requireAuth();
  await prisma.inviteCode.delete({ where: { id } });
  revalidatePath("/host/invite-codes");
}
