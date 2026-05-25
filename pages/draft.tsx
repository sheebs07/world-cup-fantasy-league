import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import DraftClient from "@/components/DraftClient";

type Owner = {
  id: number;
  name: string;
};

type Country = {
  id: number;
  name: string;
  group: string;
  fifaCode: string;
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

type DraftPickClient = {
  id: number;
  ownerId: number;
  countryId: number;
  round: number;
  pickNumber: number;
  country: {
    name: string;
    fifaCode: string;
  };
};

type Settings = {
  id: number;
  draftType: string;
  rounds: number;
  commissionerPassword: string;
  pickClockSeconds: number;
  warningSeconds: number;
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
    orderBy: { draftSlot: "asc" }
  });

  // Load countries
  const countries = await prisma.country.findMany({
    orderBy: { name: "asc" }
  });

  // Load picks with country included
  const picks = await prisma.draftPick.findMany({
    include: { country: true },
    orderBy: { pickNumber: "asc" }
  });

  // Load settings
  const settings = await prisma.settings.findFirst();

  const clientPicks: DraftPickClient[] = picks.map((p) => ({
    id: p.id,
    ownerId: p.ownerId,
    countryId: p.countryId,
    round: p.round,
    pickNumber: p.pickNumber,
    country: {
      name: p.country.name,
      fifaCode: p.country.fifaCode
    }
  }));

  return {
    props: {
      owners: owners.map((o) => ({ id: o.id, name: o.name })),
      countries,
      picks: clientPicks,
      settings: settings as Settings
    }
  };
};

export default function DraftPage({ owners, countries, picks, settings }: DraftPageProps) {
  return (
    <div style={{ padding: "0px" }}>
      <h1 style={{ marginBottom: "10px" }}>World Cup Draft Board</h1>

      <DraftClient
        owners={owners}
        countries={countries}
        picks={picks}
        settings={settings}
      />
    </div>
  );
}
