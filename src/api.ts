import { creatureFromDto } from "./game";
import type { Creature } from "./game";
import type { CreatureDto } from "./game";

const TOKEN_KEY = "gene-arena.token";

export interface UserInfo {
  id: number;
  username: string;
  coins: number;
  gems: number;
  gymProgress: number;
}

export interface Session {
  user: UserInfo;
  creatures: Creature[];
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function logout(): void {
  setToken(null);
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init?.body) headers["Content-Type"] = "application/json";

  const res = await fetch(path, { ...init, headers });

  if (res.status === 401) {
    setToken(null);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(res.token);
  return res;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(res.token);
  return res;
}

export async function fetchSession(): Promise<Session> {
  const data = await api<{ user: UserInfo; creatures: CreatureDto[] }>("/api/me");
  return { user: data.user, creatures: data.creatures.map(creatureFromDto) };
}
