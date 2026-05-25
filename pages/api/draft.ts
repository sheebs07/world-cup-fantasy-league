import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generateDraftOrder } from "@/lib/draft";

// ===============================
// ⭐ Initialize global variables
// ===============================
if (global.draftStatus === undefined) global.draftStatus = "inactive"; 
// "inactive" | "active" | "completed"

if (global.preDraftStartTime === undefined) global.preDraftStartTime = null;

if (global.pickStartTime === undefined) global.pickStartTime = new Date();

if (global.lastPickNumber === undefined) global.lastPickNumber = 1;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ===============================
  // ⭐ GET — return all picks
  // ===============================
  if (req.method === "GET") {
    const picks = await prisma.draftPick.findMany({
      orderBy: { pickNumber: "asc" },
      include: { owner: true, country: true }
    });
    return res.status(200).json(picks);
  }

  // ===============================
  // ⭐ POST — create a new pick
  // ===============================
  if (req.method === "POST") {
    const { countryId } = req.body;

    if (!countryId) {
      return res.status(400).json({ error: "Missing countryId" });
    }

    // Load league settings
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return res.status(500).json({ error: "League settings missing" });
    }

    const { rounds, draftType } = settings;

    // Load owners in draft order
    const owners = await prisma.owner.findMany({
      orderBy: { draftSlot: "asc" }
    });
    const ownerIds = owners.map(o => o.id);

    // Generate full draft order
    const draftOrder = generateDraftOrder(
      ownerIds,
      rounds,
      draftType as "snake" | "linear"
    );

    // Load existing picks
    const existingPicks = await prisma.draftPick.findMany({
      orderBy: { pickNumber: "asc" }
    });

    // Draft complete?
    if (existingPicks.length >= draftOrder.length) {
      global.draftStatus = "completed";
      return res.status(400).json({ error: "Draft complete" });
    }

    // Country already taken?
    const alreadyTaken = await prisma.draftPick.findFirst({
      where: { countryId }
    });
    if (alreadyTaken) {
      return res.status(400).json({ error: "Country already drafted" });
    }

    // Determine next owner
    const nextOwnerId = draftOrder[existingPicks.length];

    // Compute pick number + round
    const pickNumber = existingPicks.length + 1;
    const round = Math.ceil(pickNumber / owners.length);

    // Create pick
    const pick = await prisma.draftPick.create({
      data: {
        ownerId: nextOwnerId,
        countryId,
        round,
        pickNumber
      },
      include: { owner: true, country: true }
    });

    // Mark draft complete
    if (pickNumber === draftOrder.length) {
      global.draftStatus = "completed";
    }

    // Reset pick clock for next pick
    global.pickStartTime = new Date();
    global.lastPickNumber = pickNumber + 1;

    return res.status(200).json(pick);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
