import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const API_URL = "https://v3.football.api-sports.io/standings";
const API_KEY = process.env.WORLD_CUP_API_KEY;
const season = 2022;
const league = 1;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${API_URL}?league=${league}&season=${season}`, {
      headers: {
        "x-apisports-key": API_KEY!,
        "x-rapidapi-host": "v3.football.api-sports.io"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("API-Football error:", text);
      return res.status(500).json({ error: "Failed to fetch standings" });
    }

    const data = await response.json();

    const groups = data.response[0].league.standings;

    for (const group of groups) {
      for (const entry of group) {
        const team = entry.team;

        await prisma.country.upsert({
          where: { fifaCode: team.id.toString() },
          update: {
            name: team.name,
            group: entry.group.replace("Group ", ""),
            // Add stats fields if you add them to Prisma:
            played: entry.all.played,
            wins: entry.all.win,
            draws: entry.all.draw,
            losses: entry.all.lose,
            goalsFor: entry.all.goals.for,
            goalsAgainst: entry.all.goals.against,
            goalDiff: entry.goalsDiff,
            points: entry.points,
            rank: entry.rank
          },
          create: {
            name: team.name,
            fifaCode: team.id.toString(),
            group: entry.group.replace("Group ", ""),

            played: entry.all.played,
            wins: entry.all.win,
            draws: entry.all.draw,
            losses: entry.all.lose,
            goalsFor: entry.all.goals.for,
            goalsAgainst: entry.all.goals.against,
            goalDiff: entry.goalsDiff,
            points: entry.points,
            rank: entry.rank
          }
        });
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("World Cup Sync Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
