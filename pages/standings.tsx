import { GetServerSideProps } from "next";
import { useState } from "react";

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
  lastUpdated: string | null;
  baseUrl: string;
};

function resolveBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (raw.startsWith("http")) return raw;
  return `https://${raw}`;
}

export const getServerSideProps: GetServerSideProps<StandingsPageProps> = async () => {
  const baseUrl = resolveBaseUrl();

  // --- Safe fetch wrapper (prevents SSR crashes) ---
  async function safeJson(url: string) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      return JSON.parse(text);
    } catch (err) {
      console.error("Failed to load:", url, err);
      return null;
    }
  }

  const standings = (await safeJson(`${baseUrl}/api/standings`)) || [];
  const meta = await safeJson(`${baseUrl}/api/sync-meta`);

  return {
    props: {
      standings,
      lastUpdated: meta?.lastUpdated ?? null,
      baseUrl
    }
  };
};

export default function StandingsPage({ standings, lastUpdated, baseUrl }: StandingsPageProps) {
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    await fetch(`${baseUrl}/api/sync`, { method: "POST" });
    window.location.reload();
  };

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : "Never";

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px"
        }}
      >
        <h1>Standings</h1>

        <button
          onClick={refreshData}
          disabled={loading}
          style={{
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {loading ? "Refreshing…" : "Refresh Data"}
        </button>
      </div>

      <div style={{ marginBottom: "20px", color: "#555", fontSize: "14px" }}>
        <strong>Last Updated:</strong> {formattedLastUpdated}
      </div>

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
              <td style={{ padding: "8px" }}>{s.countries.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
