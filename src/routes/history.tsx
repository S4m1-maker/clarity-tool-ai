import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { FormattedOutput } from "@/components/formatted-output";
import { clearHistory, readHistory, removeHistory, type HistoryEntry } from "@/lib/history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History | Vellum AI Workspace" },
      {
        name: "description",
        content:
          "Revisit and copy the emails, meeting summaries and research briefings you generated on this device.",
      },
      { property: "og:title", content: "History | Vellum AI Workspace" },
      {
        property: "og:description",
        content: "Revisit and copy your recent AI-generated work, saved in this browser.",
      },
    ],
  }),
  component: HistoryPage,
});

const TOOL_LABEL = {
  email: "Email",
  meetings: "Meeting",
  research: "Research",
} as const;

function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = () => setEntries(readHistory());
    sync();
    window.addEventListener("vellum:history", sync);
    return () => window.removeEventListener("vellum:history", sync);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const active = entries.find((entry) => entry.id === activeId) ?? entries[0];

  return (
    <AppShell
      title="History"
      subtitle="Your recent results, kept in this browser only"
      action={
        entries.length > 0 ? (
          <button
            onClick={() => {
              clearHistory();
              setActiveId(null);
            }}
            className="shrink-0 rounded-lg border border-border px-3 py-2 font-display text-xs text-muted-foreground transition-colors hover:bg-foreground/5"
          >
            Clear all
          </button>
        ) : undefined
      }
    >
      {entries.length === 0 ? (
        <p className="text-sm text-faint">
          Nothing saved yet. Anything you generate with the three tools will appear here on this
          device.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <section className="space-y-2 lg:col-span-5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  active?.id === entry.id
                    ? "border-brand/30 bg-brand/10"
                    : "border-border hover:bg-foreground/5",
                )}
              >
                <button
                  onClick={() => setActiveId(entry.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-display text-sm font-medium text-card-foreground">
                    {entry.title || "Untitled"}
                  </p>
                  <p className="mt-1 text-[11px] text-faint">
                    {TOOL_LABEL[entry.tool]} · {entry.meta} ·{" "}
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </button>
                <button
                  onClick={() => removeHistory(entry.id)}
                  aria-label="Delete this result"
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </section>

          <section className="lg:col-span-7">
            {active && (
              <div className="bg-gradient-panel ring-glow flex h-full flex-col overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                  <span className="truncate font-display text-xs text-muted-foreground">
                    {TOOL_LABEL[active.tool]} · {active.meta}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(active.output);
                        setCopied(true);
                      } catch {
                        setCopied(false);
                      }
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-foreground/10 px-3 py-1.5 text-xs text-card-foreground transition-colors hover:bg-foreground/15"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-accent" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy to clipboard"}
                  </button>
                </div>
                <div className="p-6">
                  <FormattedOutput text={active.output} />
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
