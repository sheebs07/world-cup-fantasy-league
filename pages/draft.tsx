import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import { useState } from "react";

type Country = {
  id: number;
  fifaId: string;
  fifaCode: string;
  name: string;
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

type Owner = {
  id: number;
  name: string;
  draftSlot: number;
};

type DraftPickClient = {
  id: number;
  ownerId: number;
  countryId: number;
  round: number;
  pickNumber: number;
};

type Settings = {
  id: number;
  draftType: string;
  rounds: number;
  commissionerPassword: string;
  pickClockSeconds: number;
  warningSeconds: number;
  draftStarted: boolean;
  draftCompleted: boolean;
  currentPick: number;

};

type DraftPageProps = {
  owners: Owner[];
  countries: Country[];
  picks: DraftPickClient[];
  settings: Settings;
};

export const getServerSideProps: GetServerSideProps<DraftPageProps> = async () => {
  // Load owners
  const owners = await prisma.owner.findMany({
    orderBy: { draftSlot: "asc" },
    select: {
      id: true,
      name: true,
      draftSlot: true
    }
  });

  // Load countries (FIFA data)
  const countries = await prisma.country.findMany({
    orderBy: [{ group: "asc" }, { rank: "asc" }],
    select: {
      id: true,
      fifaId: true,
      fifaCode: true,
      name: true,
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

  // Load picks
  const picks = await prisma.draftPick.findMany({
    orderBy: { pickNumber: "asc" }
  });

  // Load settings
  const settings = await prisma.settings.findFirst({
    where: { id: 1 }
  });

  return {
    props: {
      owners,
      countries,
      picks,
      settings: settings as Settings
    }
  };
};

export default function DraftPage({ owners, countries, picks, settings }: DraftPageProps) {
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);

  const currentPickNumber = settings.currentPick;
  const totalPicks = owners.length * 3; // example: 3 rounds

  const currentOwner = owners.find(
    (o) => o.draftSlot === ((currentPickNumber - 1) % owners.length) + 1
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>Draft Board</h1>

      {/* Current Pick Banner */}
      <div
        style={{
          padding: "12px",
          background: "#f0f0f0",
          marginBottom: "20px",
          borderRadius: "6px"
        }}
      >
        <strong>Current Pick:</strong> {currentPickNumber} / {totalPicks}
        <br />
        <strong>On the Clock:</strong> {currentOwner?.name}
      </div>

      {/* Countries List */}
      <h2>Available Countries</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          marginTop: "10px"
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "8px" }}>Flag</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Country</th>
            <th style={{ padding: "8px" }}>Code</th>
            <th style={{ padding: "8px" }}>Group</th>
            <th style={{ padding: "8px" }}>Rank</th>
            <th style={{ padding: "8px" }}>Select</th>
          </tr>
        </thead>

        <tbody>
          {countries.map((c) => {
            const alreadyPicked = picks.some((p) => p.countryId === c.id);

            return (
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
                <td style={{ padding: "8px", textAlign: "center" }}>{c.rank}</td>

                <td style={{ padding: "8px", textAlign: "center" }}>
                  {alreadyPicked ? (
                    <span style={{ color: "red", fontWeight: 600 }}>Taken</span>
                  ) : (
                    <button
                      onClick={() => setSelectedCountry(c.id)}
                      style={{
                        padding: "6px 10px",
                        cursor: "pointer",
                        background: selectedCountry === c.id ? "#0070f3" : "#eee",
                        color: selectedCountry === c.id ? "white" : "black",
                        borderRadius: "4px"
                      }}
                    >
                      Select
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Selected Country */}
      {selectedCountry && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            background: "#f5f5f5",
            borderRadius: "6px"
          }}
        >
          <strong>Selected Country ID:</strong> {selectedCountry}
        </div>
      )}
    </div>
  );
}
