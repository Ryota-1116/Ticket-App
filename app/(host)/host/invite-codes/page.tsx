import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteInviteCode } from "@/app/actions/invite-codes";
import { InviteCodeForm } from "./_InviteCodeForm";
import { DeleteButton } from "@/app/_components/ui/DeleteButton";

export default async function InviteCodesPage() {
  await requireAuth();

  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-900">招待コード管理</h1>

      {/* コード一覧 */}
      {codes.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm">
          まだ招待コードがありません
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {codes.map((code) => {
            const isExhausted =
              code.maxUses !== null && code.usedCount >= code.maxUses;
            return (
              <div
                key={code.id}
                className={`bg-white rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                  isExhausted ? "border-gray-200 opacity-50" : "border-gray-200"
                }`}
              >
                <div>
                  <p className="font-mono font-bold text-gray-900 tracking-widest">
                    {code.code}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {code.maxUses === null
                      ? `使用回数: ${code.usedCount}（無制限）`
                      : `使用回数: ${code.usedCount} / ${code.maxUses}`}
                    {isExhausted && " · 上限到達"}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deleteInviteCode(code.id);
                  }}
                >
                  <DeleteButton />
                </form>
              </div>
            );
          })}
        </div>
      )}

      {/* 発行フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">コードを発行</p>
        <InviteCodeForm />
      </div>
    </div>
  );
}
