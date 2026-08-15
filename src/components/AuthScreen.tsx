import { useState } from "react";
import { fetchSession, login, register } from "../api";
import type { Session } from "../api";

interface Props {
  onAuthed: (session: Session) => void;
}

export function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await register(username, password);
      else await login(username, password);
      onAuthed(await fetchSession());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <h1>Gene Arena</h1>
      <form onSubmit={submit} className="auth-card">
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Register
          </button>
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
        </div>
        <label>
          Username
          <input
            value={username}
            minLength={3}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={busy}>
          {busy ? "…" : mode === "register" ? "Create account" : "Log in"}
        </button>
      </form>
    </div>
  );
}
