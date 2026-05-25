import { prisma } from "@/lib/prisma";

export default async function handler(req: any, res: any) {
  const picks = await prisma.draftPick.findMany({
    include: { country: true },
    orderBy: { pickNumber: "asc" }
  });

  res.status(200).json({ picks });
}
