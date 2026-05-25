import { GetServerSideProps } from "next";

type Standing = {
  ownerId: number;
  ownerName: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  countries: string[];
};

type StandingsPageProps = {
  standings: Standing[];
};

export const getServerSideProps: GetServerSideProps<StandingsPageProps> = async () => {
  // Required for Vercel SSR — relative URLs DO NOT WORK
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  const url = baseUrl.startsWith("http")
    ? baseUrl
    : `https://${baseUrl}`;

  const res = await fetch(`${url}/api/standings`);
  const standings = await res.json();

  return {
    props: { standings }
  };
};

export default function StandingsPage({ standings }: StandingsPageProps) {
  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Standings</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white"
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "8px", textAlign: "left" }}>Owner</th>
            <th style={{ padding: "8px" }}>Points</th>
            <th style={{ padding: "8px" }}>W</th>
            <th style={{ padding: "8px" }}>D</th>
            <th style={{ padding: "8px" }}>L</th>
            <th style={{ padding: "8px" }}>GF</th>
            <th style={{ padding: "8px" }}>GA</th>
            <th style={{ padding: "8px" }}>GD</th>
            <th style={{ padding: "8px" }}>Countries</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((s) => (
            <tr key={s.ownerId} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px", fontWeight: 600 }}>{s.ownerName}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{s.points}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{s.wins}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{s.draws}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{s.losses}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{s.goalsFor}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{s.goalsAgainst}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{s.goalDiff}</td>
              <td style={{ padding: "8px" }}>
                {s.countries.join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
