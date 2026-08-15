import { useEffect, useState } from "react";
import { api } from "../api";
import { creatureFromDto, creatureName } from "../game";
import type { Creature, CreatureDto } from "../game";
import { creatureLabel } from "../format";
import { CreatureSprite } from "./CreatureSprite";

interface Listing {
  id: number;
  price: number;
  sellerName: string;
  creature: CreatureDto;
}

interface Props {
  creatures: Creature[];
  coins: number;
  username: string;
  onRefresh: () => Promise<void>;
}

export function MarketView({ creatures, coins, username, onRefresh }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellId, setSellId] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadListings = async () => {
    const res = await api<{ listings: Listing[] }>("/api/market");
    setListings(res.listings);
  };

  useEffect(() => {
    loadListings().catch(() => {});
  }, []);

  const sell = async () => {
    setError("");
    setBusy(true);
    try {
      await api("/api/market", {
        method: "POST",
        body: JSON.stringify({ creatureId: sellId, price: Number(price) }),
      });
      setSellId("");
      setPrice("");
      await loadListings();
      await onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const buy = async (id: number) => {
    setError("");
    setBusy(true);
    try {
      await api(`/api/market/${id}/buy`, { method: "POST" });
      await loadListings();
      await onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: number) => {
    setError("");
    setBusy(true);
    try {
      await api(`/api/market/${id}/cancel`, { method: "POST" });
      await loadListings();
      await onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="section-title">Your coins: {coins}</p>
      <div className="sell-form">
        <label>
          List a creature
          <select value={sellId} onChange={(e) => setSellId(e.target.value)}>
            <option value="">Select…</option>
            {creatures.map((c) => (
              <option key={c.id} value={c.id}>
                {creatureLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Price
          <input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <button disabled={busy || !sellId || Number(price) < 1} onClick={sell}>
          List for sale
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="market-grid">
        {listings.map((l) => {
          const creature = creatureFromDto(l.creature);
          const mine = l.sellerName === username;
          return (
            <div key={l.id} className="listing">
              <CreatureSprite creature={creature} size={96} />
              <div className="listing-name">{creatureName(creature)}</div>
              <div className="listing-label">{creatureLabel(creature)}</div>
              <div className="price">{l.price} coins</div>
              <div className="seller">by {l.sellerName}</div>
              {mine ? (
                <button disabled={busy} onClick={() => cancel(l.id)}>
                  Cancel listing
                </button>
              ) : (
                <button disabled={busy || coins < l.price} onClick={() => buy(l.id)}>
                  Buy
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
