import Image from "next/image";
import { prisma } from "@/lib/prisma";

type CountryRow = {
  fifaCode: string;
  name: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
};

type OwnerRow = {
  ownerId: number;
  ownerName: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  rank: number;
  countries: CountryRow[];
};

export default async function StandingsPage() {
  // Load owners + picks + countries
  const owners = await prisma.owner.findMany({
    include: {
      picks: {
        include: {
          country: true
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const meta = await prisma.syncMeta.findUnique({ where: { id: 1 } });

  // Build rows
  const rows: OwnerRow[] = owners.map((o: { picks: any[]; id: any; name: any; }) => {
    const countries: CountryRow[] = o.picks.map((p) => ({
      fifaCode: p.country.fifaCode,
      name: p.country.name,
      wins: p.country.wins,
      draws: p.country.draws,
      losses: p.country.losses,
      points: p.country.points
    }));

    const wins = countries.reduce((sum, c) => sum + c.wins, 0);
    const draws = countries.reduce((sum, c) => sum + c.draws, 0);
    const losses = countries.reduce((sum, c) => sum + c.losses, 0);
    const points = countries.reduce((sum, c) => sum + c.points, 0);

    return {
      ownerId: o.id,
      ownerName: o.name,
      wins,
      draws,
      losses,
      points,
      rank: 0,
      countries
    };
  });

  // Sort standings
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  // Dense ranking
  if (rows.length > 0) {
    rows[0].rank = 1;
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const curr = rows[i];
      const same =
        prev.points === curr.points &&
        prev.wins === curr.wins &&
        prev.losses === curr.losses;

      curr.rank = same ? prev.rank : i + 1;
    }
  }

  const lastUpdated = meta?.lastUpdated?.toISOString() ?? null;

  return (
    <div style={{ padding: "20px" }}>
      <h1>League Standings</h1>

      <div style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
        Last Data Refresh:{" "}
        {lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
              Owner
            </th>
            <th style={{ textAlign: "right", borderBottom: "2px solid #ccc" }}>
              Wins
            </th>
            <th style={{ textAlign: "right", borderBottom: "2px solid #ccc" }}>
              Draws
            </th>
            <th style={{ textAlign: "right", borderBottom: "2px solid #ccc" }}>
              Losses
            </th>
            <th style={{ textAlign: "right", borderBottom: "2px solid #ccc" }}>
              Points
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((owner) => (
            <>
              <tr
                key={owner.ownerId}
                style={{
                  background: "#f7f7f7",
                  fontWeight: 700
                }}
              >
                <td style={{ padding: "8px 0" }}>
                  {owner.rank}. {owner.ownerName}
                </td>
                <td style={{ textAlign: "right" }}>{owner.wins}</td>
                <td style={{ textAlign: "right" }}>{owner.draws}</td>
                <td style={{ textAlign: "right" }}>{owner.losses}</td>
                <td style={{ textAlign: "right" }}>{owner.points}</td>
              </tr>

              {owner.countries.map((c) => (
                <tr key={c.fifaCode}>
                  <td
                    style={{
                      padding: "6px 0 6px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <Image
                      src={`/logos/${c.fifaCode}.png`}
                      alt={c.name}
                      width={28}
                      height={20}
                      style={{ objectFit: "cover", borderRadius: "3px" }}
                    />
                    {c.name}
                  </td>

                  <td style={{ textAlign: "right" }}>{c.wins}</td>
                  <td style={{ textAlign: "right" }}>{c.draws}</td>
                  <td style={{ textAlign: "right" }}>{c.losses}</td>
                  <td style={{ textAlign: "right" }}>{c.points}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
