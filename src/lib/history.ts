export type ToolId = "email" | "meetings" | "research";

export type HistoryEntry = {
  id: string;
  tool: ToolId;
  title: string;
  meta: string;
  input: string;
  output: string;
  createdAt: number;
};

const KEY = "aiflow.history.v1";
const LIMIT = 60;

function isBrowser() {
  return typeof window !== "undefined";
}

export function readHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, LIMIT)));
    window.dispatchEvent(new Event("aiflow:history"));
  } catch {
    /* storage full or unavailable — history is best effort */
  }
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "createdAt">) {
  const full: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  write([full, ...readHistory()]);
  return full;
}

export function removeHistory(id: string) {
  write(readHistory().filter((entry) => entry.id !== id));
}

export function clearHistory() {
  write([]);
}
