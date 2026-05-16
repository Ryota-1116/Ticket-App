import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HostNav } from "@/app/_components/HostNav";

export default async function HostShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <HostNav userName={user?.email ?? undefined} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
