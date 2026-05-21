import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../lib/prisma";

async function main() {
  const [events, profiles] = await Promise.all([
    prisma.event.findMany({ select: { id: true, hostId: true, title: true } }),
    prisma.profile.findMany({ select: { id: true, email: true } }),
  ]);

  console.log(`Events: ${events.length}, Users: ${profiles.length}`);

  let added = 0;
  for (const event of events) {
    const others = profiles.filter((p) => p.id !== event.hostId);
    for (const user of others) {
      await prisma.eventCollaborator.upsert({
        where: { eventId_userId: { eventId: event.id, userId: user.id } },
        create: { eventId: event.id, userId: user.id },
        update: {},
      });
      console.log(`  + ${user.email} → "${event.title}"`);
      added++;
    }
  }

  console.log(`Done: ${added} collaborator(s) added.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
