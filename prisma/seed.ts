import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 6 owners
  const owners = [
    'Abbey',
    'Brian',
    'Faja',
    'Kyle',
    'Masa',
    'Olivia'
  ];

  for (const name of owners) {
    await prisma.owner.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

 

  await prisma.syncMeta.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastUpdated: new Date(0) }
  });

  console.log("World Cup seed complete");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
