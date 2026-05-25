import { prisma } from "@/lib/prisma";

type Owner = {
  id: number;
  name: string;
  picks: {
    mlbTeam: {
      mlbId: number;
      name: string;
      division: string;
    };
  }[];
};

type OwnersPageProps = {
  owners: Owner[];
};

export async function getServerSideProps() {
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

  return {
    props: { owners }
  };
}

export default function OwnersPage({ owners }: OwnersPageProps) {
  const logo = (mlbId: number) => `/logos/${mlbId}.png`;

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>League Owners</h1>

      {owners.map((owner) => (
        <div className="card" key={owner.id}>
          <h2 style={{ marginBottom: "10px" }}>{owner.name}</h2>

          {owner.picks.length === 0 ? (
            <p style={{ color: "#666" }}>No teams drafted yet</p>
          ) : (
            <div style={{ marginTop: "10px" }}>
              {owner.picks.map((p, index) => {
                const team = p.mlbTeam;

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "6px 0",
                      borderBottom: "1px solid #eee"
                    }}
                  >
                    <img
                      src={logo(team.mlbId)}
                      alt={team.name}
                      style={{
                        width: "32px",
                        height: "32px",
                        objectFit: "contain"
                      }}
                    />

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{team.name}</span>
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {team.division}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
