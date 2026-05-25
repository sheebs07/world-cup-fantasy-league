import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";

type Country = {
  id: number;
  name: string;
  fifaCode: string;
  group: string | null;
  flagUrl: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  rank: number;
};

type CountriesPageProps = {
  countries: Country[];
};

export const getServerSideProps: GetServerSideProps<CountriesPageProps> = async () => {
  const countries = await prisma.country.findMany({
    orderBy: [{ group: "asc" }, { rank: "asc" }],
    select: {
      id: true,
      name: true,
      fifaCode: true,
      group: true,
      flagUrl: true,
      played: true,
      wins: true,
      draws: true,
      losses: true,
      goalsFor: true,
      goalsAgainst: true,
      goalDiff: true,
      points: true,
      rank: true
    }
  });

  return {
    props: { countries }
  };
};

export default function CountriesPage({ countries }: CountriesPageProps) {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Countries</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          marginTop: "20px"
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "8px" }}>Flag</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Country</th>
            <th style={{ padding: "8px" }}>Code</th>
            <th style={{ padding: "8px" }}>Group</th>
            <th style={{ padding: "8px" }}>Pts</th>
            <th style={{ padding: "8px" }}>W</th>
            <th style={{ padding: "8px" }}>D</th>
            <th style={{ padding: "8px" }}>L</th>
            <th style={{ padding: "8px" }}>GF</th>
            <th style={{ padding: "8px" }}>GA</th>
            <th style={{ padding: "8px" }}>GD</th>
          </tr>
        </thead>

        <tbody>
          {countries.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px" }}>
                {c.flagUrl && (
                  <img
                    src={c.flagUrl}
                    alt={c.fifaCode}
                    width={32}
                    height={24}
                    style={{ borderRadius: "3px", objectFit: "cover" }}
                  />
                )}
              </td>

              <td style={{ padding: "8px" }}>{c.name}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{c.fifaCode}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{c.group ?? "-"}</td>

              <td style={{ padding: "8px", textAlign: "center" }}>{c.points}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{c.wins}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{c.draws}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{c.losses}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{c.goalsFor}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{c.goalsAgainst}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{c.goalDiff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
