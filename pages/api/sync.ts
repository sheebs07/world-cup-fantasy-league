import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const COMPETITION_ID = 17;     // World Cup
const SEASON_ID = 255713;      // 2022 World Cup season

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // -----------------------------
    // 1. Fetch Teams (metadata)
    // -----------------------------
    const teamsRes = await fetch(
      `https://api.fifa.com/api/v3/teams?competition=${COMPETITION_ID}&season=${SEASON_ID}`
    );

    const teamsJson = await teamsRes.json();

    const teams = teamsJson?.Teams || [];

    // Build a lookup: fifaId → team metadata
    const teamMap: Record<string, any> = {};

    for (const t of teams) {
      const id = t?.IdTeam?.toString();
      if (!id) continue;

      teamMap[id] = {
        fifaId: id,
        fifaCode: t?.Abbreviation || "",
        name: t?.TeamName || "",
        flagUrl: t?.PictureUrl || null
      };
    }

    // -----------------------------
    // 2. Fetch Standings (stats)
    // -----------------------------
    const standingsRes = await fetch(
      `https://api.fifa.com/api/v3/standings?competition=${COMPETITION_ID}&season=${SEASON_ID}`
    );

    const standingsJson = await standingsRes.json();

    const standings = standingsJson?.Results || [];

    let count = 0;

    // -----------------------------
    // 3. Merge teams + standings
    // -----------------------------
    for (const group of standings) {
      const groupName = group?.GroupName || null;
      const teamRecords = group?.TeamStandings || [];

      for (const record of teamRecords) {
        const team = record?.Team;
        if (!team) continue;

        const fifaId = team?.IdTeam?.toString();
        if (!fifaId) continue;

        const meta = teamMap[fifaId];
        if (!meta) continue;

        await prisma.country.upsert({
          where: { fifaId },
          update: {
            fifaCode: meta.fifaCode,
            name: meta.name,
            group: groupName,
            flagUrl: meta.flagUrl,

            played: record?.Played || 0,
            wins: record?.Won || 0,
            draws: record?.Drawn || 0,
            losses: record?.Lost || 0,
            goalsFor: record?.GoalsFor || 0,
            goalsAgainst: record?.GoalsAgainst || 0,
            goalDiff: record?.GoalDifference || 0,
            points: record?.Points || 0,
            rank: record?.Position || 0
          },
          create: {
            fifaId,
            fifaCode: meta.fifaCode,
            name: meta.name,
            group: groupName,
            flagUrl: meta.flagUrl,

            played: record?.Played || 0,
            wins: record?.Won || 0,
            draws: record?.Drawn || 0,
            losses: record?.Lost || 0,
            goalsFor: record?.GoalsFor || 0,
            goalsAgainst: record?.GoalsAgainst || 0,
            goalDiff: record?.GoalDifference || 0,
            points: record?.Points || 0,
            rank: record?.Position || 0
          }
        });

        count++;
      }
    }

    // -----------------------------
    // 4. Update SyncMeta
    // -----------------------------
    await prisma.syncMeta.upsert({
      where: { id: 1 },
      update: { lastUpdated: new Date() },
      create: { id: 1, lastUpdated: new Date() }
    });

    return res.status(200).json({ status: "ok", count });
  } catch (err) {
    console.error("FIFA Sync Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
