import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// OpenLigaDB World Cup 2022 groups are numbered 1–8
const SEASON = 2022;

// 1 = Group A, 2 = Group B, ..., 8 = Group H
const GROUP_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let count = 0;

    for (const groupId of GROUP_IDS) {
      const url = `https://api.openligadb.de/getbltable/wm${SEASON}/${groupId}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error("OpenLigaDB error:", await response.text());
        continue;
      }

      const table = await response.json();

      // Each entry is a team in the group standings
      for (const entry of table) {
        const fifaCode = entry.shortName; // e.g., BRA, ARG, FRA
        const name = entry.teamName;
        const group = entry.groupName.replace("Group ", "");

        await prisma.country.upsert({
          where: { fifaCode },
          update: {
            name,
            group,

            played: entry.matches,
            wins: entry.won,
            draws: entry.draw,
            losses: entry.lost,

            goalsFor: entry.goals,
            goalsAgainst: entry.opponentGoals,
            goalDiff: entry.goalDiff,

            points: entry.points,
            rank: entry.rank
          },
          create: {
            fifaCode,
            name,
            group,

            played: entry.matches,
            wins: entry.won,
            draws: entry.draw,
            losses: entry.lost,

            goalsFor: entry.goals,
            goalsAgainst: entry.opponentGoals,
            goalDiff: entry.goalDiff,

            points: entry.points,
            rank: entry.rank
          }
        });

        count++;
      }
    }

    // Update global sync timestamp
    await prisma.syncMeta.upsert({
      where: { id: 1 },
      update: { lastUpdated: new Date() },
      create: { id: 1, lastUpdated: new Date() }
    });

    return res.status(200).json({ status: "ok", count });
  } catch (err) {
    console.error("World Cup Sync Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
