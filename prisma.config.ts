import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Prisma CLI does not load .env.local automatically (that's a Next.js convention)
config({ path: ".env.local" });

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL!,
  },
});
