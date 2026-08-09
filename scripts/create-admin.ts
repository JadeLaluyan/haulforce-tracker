/**
 * One-off admin account creator — creates a single MANAGER user without
 * touching any other data (unlike prisma/seed.ts, which wipes everything).
 * Run with: DATABASE_URL="..." npx tsx scripts/create-admin.ts <email> <password> [name]
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [name]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, name: name ?? "Admin", role: "MANAGER" },
    create: { email: email.toLowerCase(), passwordHash, name: name ?? "Admin", role: "MANAGER" },
  });

  console.log(`User ready: ${user.email} (${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
