import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
  const count = await prisma.etf.count();
  console.log(`Total ETFs: ${count}`);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
