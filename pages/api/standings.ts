import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const standings = owners.map((owner) => {
      const countries = owner.picks.map((p) => p.country);

      const wins = countries.reduce((s, c) => s + c.wins, 0);
      const draws = countries.reduce((s, c) => s + c.draws, 0);
      const losses = countries.reduce((s, c) => s + c.losses, 0);
      const goalsFor = countries.reduce((s, c) => s + c.goalsFor, 0);
      const goalsAgainst = countries.reduce((s, c) => s + c.goalsAgainst, 0);
      const goalDiff = goalsFor - goalsAgainst;
      const points = countries.reduce((s, c) => s + c.points, 0);

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
          id: c.id,
          fifaId: c.fifaId,
          fifaCode: c.fifaCode,
          name: c.name,
          group: c.group,
          flagUrl: c.flagUrl,

          played: c.played,
          wins: c.wins,
          draws: c.draws,
          losses: c.losses,
          goalsFor: c.goalsFor,
          goalsAgainst: c.goalsAgainst,
          goalDiff: c.goalDiff,
          points: c.points,
          rank: c.rank
        }))
      };
    });

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
