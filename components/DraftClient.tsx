"use client";

import { useState, useEffect } from "react";

type Owner = {
  id: number;
  name: string
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


type DraftPick = {
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

type DraftState = {
  currentPick: number;
  currentRound: number;
  onTheClockOwnerId: number;
  snakeOrder: number[];
  pickStartTime: string; // ISO string from server
  draftStatus: "inactive" | "active" | "completed";
  preDraftStartTime: string | null; // ISO string or null
};

type Settings = {
  id: number;
  draftType: string;
  rounds: number;
  commissionerPassword: string;
  pickClockSeconds: number;
  warningSeconds: number;
};

export default function DraftClient({
  owners,
  countries,
  picks: initialPicks,
  settings
}: {
  owners: Owner[];
  countries: Country[];
  picks: DraftPick[];
  settings: Settings;
}) {
  const [picks, setPicks] = useState(initialPicks);
  const [loading, setLoading] = useState(false);
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [allPicks, setAllPicks] = useState<DraftPick[]>(initialPicks);
  const [preCountdown, setPreCountdown] = useState<number | null>(null);

  const rounds = settings.rounds;
  const isSnake = settings.draftType === "snake";

  // ⭐ Commissioner Login
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [passcode, setPasscode] = useState("");

  const handleCommissionerAuth = () => {
    if (passcode === settings.commissionerPassword) {
      setIsCommissioner(true);
      setShowPassPrompt(false);
    } else {
      alert("Incorrect passcode");
    }
  };

  // ⭐ Pick Clock
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ⭐ Helper: short team names (no cities)
  const getShortTeamName = (fullName: string) => {
    const parts = fullName.split(" ");
    return parts[parts.length - 1];
  };

  // ⭐ Helper: get owner for a given overall pick number
  const getOwnerForPick = (overallPick: number) => {
    if (!draftState) return null;

    if (isSnake) {
      return draftState.snakeOrder[overallPick - 1];
    }

    const ownersPerRound = owners.length;
    const index = (overallPick - 1) % ownersPerRound;
    return owners[index].id;
  };

  // Poll draft state + picks every 3 seconds
  useEffect(() => {
    const load = async () => {
      const stateRes = await fetch("/api/draftState");
      const stateData = await stateRes.json();
      setDraftState(stateData);

      const picksRes = await fetch("/api/getPicks");
      const picksData = await picksRes.json();

      const transformed = picksData.picks.map((p: any) => ({
        id: p.id,
        ownerId: p.ownerId,
        fifaCode: p.fifaCode,
        round: p.round,
        pickNumber: p.pickNumber,
        country: {
          name: p.country.name,
          fifaCode: p.country.fifaCode
        }
      }));

      setAllPicks(transformed);
    };

    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  // ⭐ Compute timeLeft from server pickStartTime
  useEffect(() => {
    if (!draftState?.pickStartTime) return;

    const start = new Date(draftState.pickStartTime).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const remaining = settings.pickClockSeconds - elapsed;

    setTimeLeft(Math.max(remaining, 0));
  }, [draftState?.pickStartTime, settings.pickClockSeconds]);

  // ⭐ Smooth ticking countdown
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Handle 5-second pre-draft countdown
  useEffect(() => {
    if (!draftState) return;

    if (draftState.preDraftStartTime && draftState.draftStatus === "inactive") {
      const start = new Date(draftState.preDraftStartTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = 5 - elapsed;

      setPreCountdown(Math.max(remaining, 0));

      if (remaining <= 0) {
        fetch("/api/activateDraft", { method: "POST" });
      }
    } else {
      setPreCountdown(null);
    }
  }, [draftState?.preDraftStartTime, draftState?.draftStatus]);

  const takenTeamIds = new Set(allPicks.map((p) => p.country.fifaCode));
  const totalPicks = owners.length * rounds;
  const currentPickNumber = allPicks.length + 1;
  const draftComplete = allPicks.length >= totalPicks;

  const getLogoUrl = (country: Country) => `/logos/${country.fifaCode}.png`;

  const handlePick = async (teamId: number) => {
    setLoading(true);

    const res = await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mlbTeamId: teamId })
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Error making pick");
      return;
    }

    const p = await res.json();

    const clientPick: DraftPick = {
      id: p.id,
      ownerId: p.ownerId,
      countryId: p.countryId,
      round: p.round,
      pickNumber: p.pickNumber,
      country: {
        name: p.country.name,
        fifaCode: p.country.fifaCode
      }
    };

    setPicks((prev) => [...prev, clientPick]);
    setAllPicks((prev) => [...prev, clientPick]);
  };

  // Build pivoted grid: grid[round][ownerId]
  const grid: Record<number, Record<number, DraftPick | null>> = {};
  for (let r = 1; r <= rounds; r++) {
    grid[r] = {};
    owners.forEach((o) => {
      grid[r][o.id] = null;
    });
  }

  allPicks.forEach((p) => {
    grid[p.round][p.ownerId] = p;
  });

  // Compute next 5 picks (including on-the-clock)
  let nextPicks: { pickNumber: number; ownerId: number }[] = [];
  if (draftState && !draftComplete) {
    for (let i = 0; i < 6; i++) {
      const pickNum = draftState.currentPick + i;
      if (pickNum > totalPicks) break;

      const ownerId = getOwnerForPick(pickNum);
      nextPicks.push({ pickNumber: pickNum, ownerId: ownerId! });
    }
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px", position: "relative" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        {!draftComplete ? (
          <p style={{ color: "#555", margin: 0 }}>
            Pick {currentPickNumber} of {totalPicks}
          </p>
        ) : (
          <p style={{ color: "green", fontWeight: 600, margin: 0 }}>
            Draft Complete
          </p>
        )}
      </div>

      {/* COMMISSIONER LOGIN BUTTON (UPPER RIGHT) */}
      {!isCommissioner && (
        <button
          onClick={() => setShowPassPrompt(true)}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            padding: "8px 12px",
            background: "#0070f3",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
            zIndex: 10
          }}
        >
          Commissioner Login
        </button>
      )}

      {isCommissioner && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            padding: "8px 12px",
            background: "#4caf50",
            color: "white",
            borderRadius: "6px",
            fontWeight: 600,
            zIndex: 10
          }}
        >
          Commissioner Mode
        </div>
      )}

      {/* COMMISSIONER LOGIN BUTTON */}
      {/* {!isCommissioner && (
        <button
          onClick={() => setShowPassPrompt(true)}
          style={{
            padding: "6px 12px",
            background: "#0070f3",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "10px"
          }}
        >
          Commissioner Login
        </button>
      )} */}

      {/* COMMISSIONER LOGIN MODAL */}
      {showPassPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
        >
          <div
            className="card"
            style={{
              padding: "20px",
              width: "350px",
              background: "white",
              borderRadius: "8px"
            }}
          >
            <h2>Commissioner Login</h2>

            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "10px",
                marginBottom: "10px"
              }}
            />

            <button
              onClick={handleCommissionerAuth}
              style={{
                padding: "8px 12px",
                background: "#0070f3",
                color: "white",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Unlock
            </button>

            <button
              onClick={() => setShowPassPrompt(false)}
              style={{
                marginTop: "10px",
                padding: "6px 10px",
                width: "100%",
                background: "#ccc",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DRAFT STATUS BANNER */}
      <div
        style={{
          padding: "12px",
          background: "#222",
          color: "white",
          marginBottom: "20px",
          borderRadius: "6px",
          textAlign: "center",
          fontSize: "18px",
          fontWeight: 600
        }}
      >
        {draftState?.draftStatus === "inactive" && preCountdown === null && (
          <div>
            Draft – Inactive
            {isCommissioner && (
              <button
                onClick={() => fetch("/api/startDraft", { method: "POST" })}
                style={{
                  marginLeft: "15px",
                  padding: "6px 12px",
                  background: "#0070f3",
                  color: "white",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Start Draft
              </button>
            )}
          </div>
        )}

        {draftState?.draftStatus === "inactive" && preCountdown !== null && (
          <div>Draft begins in {preCountdown}…</div>
        )}

        {draftState?.draftStatus === "active" && <div>Draft – Active</div>}

        {draftState?.draftStatus === "completed" && (
          <div>Draft – Completed</div>
        )}
      </div>

      {/* ⭐ PICK CLOCK */}
      {!draftComplete &&
        timeLeft !== null &&
        draftState?.draftStatus === "active" && (
          <div
            style={{
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "6px",
              textAlign: "center",
              fontWeight: 700,
              fontSize: "20px",
              background:
                timeLeft <= settings.warningSeconds ? "#ffe0e0" : "#e8f4ff",
              border:
                timeLeft <= settings.warningSeconds
                  ? "2px solid #ff6b6b"
                  : "2px solid #aacbff"
            }}
          >
            Pick Clock: {timeLeft}s
          </div>
        )}

      {/* UPCOMING PICKS STRIP (ONLY WHEN ACTIVE) */}
      {draftState?.draftStatus === "active" &&
        !draftComplete &&
        draftState && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              background: "#f0f7ff",
              border: "1px solid #cce0ff",
              borderRadius: "6px"
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "8px" }}>
              Upcoming Picks
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {nextPicks.map((np, idx) => {
                const owner = owners.find((o) => o.id === np.ownerId);

                return (
                  <div
                    key={np.pickNumber}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "4px",
                      background: idx === 0 ? "#d4f8d4" : "#fff",
                      border:
                        idx === 0
                          ? "1px solid #8cd98c"
                          : "1px solid #ddd",
                      fontWeight: idx === 0 ? 700 : 500
                    }}
                  >
                    {idx === 0 ? "On the Clock: " : ""}
                    {(() => {
                      const ownersPerRound = owners.length;
                      const overall = np.pickNumber;
                      const round = Math.ceil(overall / ownersPerRound);
                      const ownerIdForPick = getOwnerForPick(overall)!;
                      const ownerIndexInRound = owners.findIndex(
                        (o) => o.id === ownerIdForPick
                      );

                      const pickInRound = isSnake
                        ? round % 2 === 1
                          ? ownerIndexInRound + 1
                          : ownersPerRound - ownerIndexInRound
                        : ownerIndexInRound + 1;

                      return `${owner?.name} - ${round}.${pickInRound} (#${overall})`;
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}

            {/* DRAFT BOARD */}
      <table
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          borderCollapse: "collapse",
          textAlign: "center",
          marginBottom: "30px"
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                borderBottom: "2px solid #ccc",
                padding: "8px"
              }}
            ></th>
            {owners.map((owner) => (
              <th
                key={owner.id}
                style={{
                  borderBottom: "2px solid #ccc",
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "700",
                  background:
                    draftState?.onTheClockOwnerId === owner.id &&
                    !draftComplete
                      ? "#e0ffe0"
                      : "transparent"
                }}
              >
                {owner.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rounds }, (_, i) => i + 1).map((round) => (
            <tr key={round}>
              <td
                style={{
                  padding: "8px",
                  fontWeight: 700,
                  borderRight: "2px solid #ccc"
                }}
              >
                Round {round}
              </td>

              {owners.map((owner) => {
                const pick = grid[round][owner.id];
                const ownerIndex = owners.findIndex((o) => o.id === owner.id);
                const ownersPerRound = owners.length;

                let overallPickNumber: number;

                if (!isSnake) {
                  overallPickNumber =
                    (round - 1) * ownersPerRound + (ownerIndex + 1);
                } else {
                  overallPickNumber =
                    round % 2 === 1
                      ? (round - 1) * ownersPerRound + (ownerIndex + 1)
                      : (round - 1) * ownersPerRound +
                        (ownersPerRound - ownerIndex);
                }

                const isOnClock =
                  draftState &&
                  overallPickNumber === draftState.currentPick;

                return (
                  <td
                    key={owner.id}
                    style={{
                      padding: "8px",
                      border: "1px solid #ddd",
                      background: isOnClock
                        ? "#e0ffe0"
                        : pick
                        ? "#fff3cd"
                        : "transparent"
                    }}
                  >
                    {pick ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: "6px",
                          justifyContent: "flex-start"
                        }}
                      >
                        <img
                          src={`/logos/${pick.country.fifaCode}.png`}
                          alt={pick.country.name}
                          style={{
                            width: "45px",
                            height: "45px",
                            objectFit: "contain",
                            flexShrink: 0
                          }}
                        />

                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "16px",
                            textAlign: "left",
                            lineHeight: 1.2,
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            maxWidth: "100%"
                          }}
                        >
                          {getShortTeamName(pick.country.name)}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "14px", color: "#555" }}>
                        {(() => {
                          const indexInRound = ownerIndex;
                          const pickInRound = !isSnake
                            ? indexInRound + 1
                            : round % 2 === 1
                            ? indexInRound + 1
                            : ownersPerRound - indexInRound;

                          return `${round}.${pickInRound}`;
                        })()}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* AVAILABLE TEAMS */}
      <h3 style={{ marginBottom: "10px" }}>Available Countries</h3>

      {loading && <p style={{ color: "#777" }}>Submitting pick…</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "12px"
        }}
      >
        {countries
          .filter((t) => !takenTeamIds.has(t.fifaCode))
          .map((country) => (
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
                src={getLogoUrl(country)}
                alt={country.name}
                style={{
                  width: "48px",
                  height: "48px",
                  objectFit: "contain"
                }}
              />

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>
                  {getShortTeamName(country.name)}
                </div>
                <div style={{ color: "#666", fontSize: "13px" }}>
                  {country.group}
                </div>
              </div>

              <button
                onClick={() => handlePick(country.id)}
                disabled={loading || draftComplete}
                style={{
                  marginLeft: "auto",
                  padding: "6px 10px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Draft Team
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

