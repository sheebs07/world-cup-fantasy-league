import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const owners = await prisma.owner.findMany({
      include: {
        picks: {
          include: {
            country: true
          }
        }
      }
    });

    const standings = owners.map((o) => {
      const wins = o.picks.reduce((sum, p) => sum + p.country.wins, 0);
      const draws = o.picks.reduce((sum, p) => sum + p.country.draws, 0);
      const losses = o.picks.reduce((sum, p) => sum + p.country.losses, 0);
      const points = o.picks.reduce((sum, p) => sum + p.country.points, 0);
      const goalsFor = o.picks.reduce((sum, p) => sum + p.country.goalsFor, 0);
      const goalsAgainst = o.picks.reduce((sum, p) => sum + p.country.goalsAgainst, 0);
      const goalDiff = goalsFor - goalsAgainst;

      return {
        ownerId: o.id,
        ownerName: o.name,
        wins,
        draws,
        losses,
        points,
        goalsFor,
        goalsAgainst,
        goalDiff,
        countries: o.picks.map((p) => p.country.name)
      };
    });

    // ⭐ Correct World Cup sorting:
    // 1. Points (desc)
    // 2. Wins (desc)
    // 3. Goal Differential (desc)
    // 4. Goals For (desc)
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

    return res.status(200).json(standings);
  } catch (err) {
    console.error("Standings API Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
