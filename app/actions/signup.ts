"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

export type SignupState = { error?: string; success?: boolean };

const SignupSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
  inviteCode: z.string().min(1, "招待コードを入力してください"),
});

export async function signup(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };

  const { email, password, inviteCode } = parsed.data;
  const normalizedCode = inviteCode.trim().toUpperCase();

  const code = await prisma.inviteCode.findUnique({
    where: { code: normalizedCode },
  });
  if (!code) return { error: "招待コードが正しくありません" };
  if (code.maxUses !== null && code.usedCount >= code.maxUses)
    return { error: "この招待コードは使用上限に達しています" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes("already registered"))
      return { error: "このメールアドレスはすでに登録されています" };
    return { error: "登録に失敗しました。もう一度お試しください" };
  }

  await prisma.inviteCode.update({
    where: { id: code.id },
    data: { usedCount: { increment: 1 } },
  });

  // メール確認が不要な場合（auto-confirm）はそのままログイン状態になる
  if (data.session) {
    await prisma.profile.upsert({
      where: { id: data.user!.id },
      update: {},
      create: { id: data.user!.id, email: data.user!.email! },
    });
    redirect("/host/events");
  }

  return { success: true };
}
