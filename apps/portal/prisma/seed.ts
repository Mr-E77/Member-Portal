// apps/portal/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { genericConfig } from "../src/config/genericConfig";
import { campusSoundConfig } from "../src/config/campusSoundConfig";
import { techStartupConfig } from "../src/config/techStartupConfig";
import { fitnessClubConfig } from "../src/config/fitnessClubConfig";

const databaseUrl = process.env.DATABASE_URL || "postgresql://mreuser:mrepassword@localhost:5432/mre_portal";
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Seed Portal Configurations
  console.log("📝 Seeding portal configurations...");

  const configs = [
    {
      id: "generic-default",
      name: "Generic Platform",
      preset: "generic",
      data: genericConfig,
    },
    {
      id: "campus-sound-united",
      name: "Campus Sound United",
      preset: "campus-sound",
      data: campusSoundConfig,
    },
    {
      id: "tech-startup-hub",
      name: "Tech Startup Hub",
      preset: "tech-startup",
      data: techStartupConfig,
    },
    {
      id: "fitness-club",
      name: "Peak Performance Hub",
      preset: "fitness-club",
      data: fitnessClubConfig,
    },
  ];

  for (const config of configs) {
    await prisma.portalConfigModel.upsert({
      where: { id: config.id },
      update: {
        name: config.name,
        preset: config.preset,
        data: config.data as any,
      },
      create: {
        id: config.id,
        name: config.name,
        preset: config.preset,
        data: config.data as any,
      },
    });
    console.log(`  ✅ ${config.name} (${config.id})`);
  }

  // Seed Demo Users
  console.log("\n👥 Seeding demo users...");

  const demoUsers = [
    {
      id: "user-demo-1",
      name: "Alice Johnson",
      email: "alice@example.com",
      membershipTier: "tier1",
    },
    {
      id: "user-demo-2",
      name: "Bob Smith",
      email: "bob@example.com",
      membershipTier: "tier2",
    },
    {
      id: "user-demo-3",
      name: "Carol Williams",
      email: "carol@example.com",
      membershipTier: "tier3",
    },
    {
      id: "user-demo-4",
      name: "David Brown",
      email: "david@example.com",
      membershipTier: "tier4",
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        membershipTier: user.membershipTier,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        membershipTier: user.membershipTier,
      },
    });
    console.log(`  ✅ ${user.name} (${user.email}) - Tier ${user.membershipTier}`);
  }

  console.log("\n✨ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
