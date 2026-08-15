import { useEffect, useState } from "react";
import { api, fetchSession, getToken, logout } from "./api";
import type { Session, UserInfo } from "./api";
import { creatureFromDto } from "./game";
import type { Creature, CreatureDto } from "./game";
import { RanchView } from "./components/RanchView";
import { BreedView } from "./components/BreedView";
import { BattleView } from "./components/BattleView";
import { MarketView } from "./components/MarketView";
import { CampaignView } from "./components/CampaignView";
import { AuthScreen } from "./components/AuthScreen";

type Tab = "ranch" | "breed" | "battle" | "campaign" | "market";

const TABS: { id: Tab; label: string }[] = [
  { id: "ranch", label: "Ranch" },
  { id: "breed", label: "Breed" },
  { id: "battle", label: "Battle" },
  { id: "campaign", label: "Campaign" },
  { id: "market", label: "Market" },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ranch");

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    fetchSession()
      .then(setSession)
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  const handleBreed = async (aId: string, bId: string): Promise<Creature> => {
    const res = await api<{ child: CreatureDto; coins: number }>("/api/breed", {
      method: "POST",
      body: JSON.stringify({ parentAId: aId, parentBId: bId }),
    });
    const child = creatureFromDto(res.child);
    setSession((s) =>
      s
        ? { ...s, user: { ...s.user, coins: res.coins }, creatures: [...s.creatures, child] }
        : s,
    );
    return child;
  };

  const handleReportBattle = async (
    won: boolean,
    team: { id: string; level: number; xp: number }[],
  ) => {
    const res = await api<{ coins: number }>("/api/battle/report", {
      method: "POST",
      body: JSON.stringify({ won, team }),
    });
    setSession((s) => {
      if (!s) return s;
      const map = new Map(team.map((t) => [t.id, { level: t.level, xp: t.xp }]));
      const creatures = s.creatures.map((c) => {
        const update = map.get(c.id);
        return update ? { ...c, level: update.level, xp: update.xp } : c;
      });
      return { ...s, user: { ...s.user, coins: res.coins }, creatures };
    });
  };

  const refresh = async () => {
    setSession(await fetchSession());
  };

  const handleBeatGym = async (gymId: number) => {
    const res = await api<{ progress: number; coins: number }>("/api/campaign/beat", {
      method: "POST",
      body: JSON.stringify({ gymId }),
    });
    setSession((s) =>
      s
        ? { ...s, user: { ...s.user, coins: res.coins, gymProgress: res.progress } }
        : s,
    );
  };

  if (loading) {
    return (
      <div className="app">
        <p>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthed={setSession} />;
  }

  const user: UserInfo = session.user;

  return (
    <div className="app">
      <header>
        <h1>Gene Arena</h1>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "ranch" ? ` (${session.creatures.length})` : ""}
            </button>
          ))}
        </nav>
        <span className="wallet">
          <span className="coins">{user.coins} coins</span>
          <span className="username">{user.username}</span>
          <button onClick={handleLogout}>Log out</button>
        </span>
      </header>
      <main>
        {tab === "ranch" && <RanchView creatures={session.creatures} />}
        {tab === "breed" && <BreedView creatures={session.creatures} onBreed={handleBreed} />}
        {tab === "battle" && (
          <BattleView creatures={session.creatures} onReportBattle={handleReportBattle} />
        )}
        {tab === "campaign" && (
          <CampaignView
            gymProgress={user.gymProgress}
            creatures={session.creatures}
            onReportBattle={handleReportBattle}
            onBeatGym={handleBeatGym}
          />
        )}
        {tab === "market" && (
          <MarketView
            creatures={session.creatures}
            coins={user.coins}
            username={user.username}
            onRefresh={refresh}
          />
        )}
      </main>
    </div>
  );
}
