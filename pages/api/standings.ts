import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Load all owners with their picks and linked countries
    const owners = await prisma.owner.findMany({
      include: {
        picks: {
          include: {
            country: true
          }
        }
      }
    });

    const standings = owners.map((owner) => {
      const countries = owner.picks.map((p) => p.country);

      // Aggregate stats across all picked countries
      const wins = countries.reduce((sum, c) => sum + c.wins, 0);
      const draws = countries.reduce((sum, c) => sum + c.draws, 0);
      const losses = countries.reduce((sum, c) => sum + c.losses, 0);
      const goalsFor = countries.reduce((sum, c) => sum + c.goalsFor, 0);
      const goalsAgainst = countries.reduce((sum, c) => sum + c.goalsAgainst, 0);
      const goalDiff = goalsFor - goalsAgainst;
      const points = countries.reduce((sum, c) => sum + c.points, 0);

      return {
        ownerId: owner.id,
        ownerName: owner.name,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDiff,
        points,
        countries: countries.map((c) => ({
          fifaCode: c.fifaCode,
          flagUrl: c.flagUrl
        }))
      };
    });

    // Sort standings by points → goalDiff → goalsFor
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

    return res.status(200).json(standings);
  } catch (err) {
    console.error("Standings API Error:", err);
    return res.status(500).json({ error: "Failed to load standings" });
  }
}
