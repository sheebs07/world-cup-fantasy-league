import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";

type Country = {
  id: number;
  name: string;
  group: string;
  fifaCode: string;
};

type CountriesPageProps = {
  countries: Country[];
};

export const getServerSideProps: GetServerSideProps<CountriesPageProps> = async () => {
  const countries = await prisma.country.findMany({
    select: {
      id: true,
      name: true,
      group: true,
      fifaCode: true
    },
    orderBy: { name: "asc" }
  });

  return {
    props: { countries }
  };
};

export default function CountriesPage({ countries }: CountriesPageProps) {
  const getFlagUrl = (country: Country) => `/logos/${country.fifaCode}.png`;

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>World Cup Countries</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px"
        }}
      >
        {countries.map((country) => (
          <div
            key={country.id}
            className="card"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "12px",
              gap: "12px",
              background: "white"
            }}
          >
            <img
              src={getFlagUrl(country)}
              alt={country.name}
              style={{
                width: "48px",
                height: "32px",
                objectFit: "cover",
                borderRadius: "4px"
              }}
            />

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 600, fontSize: "15px" }}>
                {country.name}
              </div>

              <div style={{ color: "#666", fontSize: "13px" }}>
                Group {country.group}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
