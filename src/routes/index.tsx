import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { OutputPane } from "@/components/output-pane";
import { generateEmail } from "@/lib/ai.functions";
import { addHistory } from "@/lib/history";
import { AUDIENCES, TONES, type Audience, type Tone } from "@/lib/prompts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Vellum AI Workspace" },
      {
        name: "description",
        content:
          "Turn a short brief into a ready-to-send professional email, tuned to tone and audience, with one-click copy.",
      },
      { property: "og:title", content: "Smart Email Generator | Vellum AI Workspace" },
      {
        property: "og:description",
        content:
          "Turn a short brief into a ready-to-send professional email, tuned to tone and audience.",
      },
    ],
  }),
  component: EmailTool,
});

function EmailTool() {
  const run = useServerFn(generateEmail);
  const [tone, setTone] = useState<Tone>("Formal");
  const [audience, setAudience] = useState<Audience>("Client");
  const [brief, setBrief] = useState("");
  const [sender, setSender] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const generate = async () => {
    if (!brief.trim() || status === "loading") return;
    setStatus("loading");
    setError(undefined);
    try {
      const result = await run({
        data: { brief: brief.trim(), tone, audience, ...(sender.trim() ? { sender: sender.trim() } : {}) },
      });
      setOutput(result.text);
      setStatus("ready");
      addHistory({
        tool: "email",
        title: result.text.split("\n")[0]?.replace(/^Subject:\s*/i, "") ?? "Email draft",
        meta: `${tone} · ${audience}`,
        input: brief.trim(),
        output: result.text,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <AppShell
      title="Smart Email Generator"
      subtitle="Context-aware drafts, tuned to tone and audience"
      action={
        <button
          onClick={generate}
          disabled={!brief.trim() || status === "loading"}
          className="ring-glow shrink-0 rounded-lg bg-gradient-brand px-4 py-2 font-display text-sm font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {status === "loading" ? "Drafting…" : "Generate draft"}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-5">
          <div>
            <label className="font-display text-xs font-medium text-muted-foreground">Tone</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map((option) => (
                <button
                  key={option}
                  onClick={() => setTone(option)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs transition-colors",
                    tone === option
                      ? "border border-brand/40 bg-brand/20 text-card-foreground"
                      : "border border-border text-muted-foreground hover:bg-foreground/5",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-medium text-muted-foreground">
              Audience
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {AUDIENCES.map((option) => (
                <button
                  key={option}
                  onClick={() => setAudience(option)}
                  className={cn(
                    "rounded-lg py-2 text-xs transition-colors",
                    audience === option
                      ? "border border-accent/40 bg-accent/15 text-accent"
                      : "border border-border text-muted-foreground hover:bg-foreground/5",
                  )}
                >
                  {option === "Internal Team" ? "Team" : option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-medium text-muted-foreground">Brief</label>
            <textarea
              rows={8}
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Following up on yesterday's call about the Q3 redesign scope. Need to reconfirm the budget ceiling and lock the two-week delivery timeline with the client before Friday."
              className="mt-2 w-full resize-none rounded-xl border border-border bg-foreground/5 p-4 text-sm text-foreground placeholder-faint focus:border-brand/40 focus:ring-1 focus:ring-brand/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-display text-xs font-medium text-muted-foreground">
              Sign off as (optional)
            </label>
            <input
              value={sender}
              onChange={(event) => setSender(event.target.value)}
              placeholder="Alex Rivera, Head of Digital Strategy"
              className="mt-2 w-full rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder-faint focus:border-brand/40 focus:ring-1 focus:ring-brand/30 focus:outline-none"
            />
          </div>
        </section>

        <section className="lg:col-span-7">
          <OutputPane
            label={
              status === "ready" ? `Generated draft · ${tone} · ${audience}` : "Draft output"
            }
            status={status}
            text={output}
            error={error}
            emptyHint="Write a short brief, pick a tone and audience, then generate a draft. It will appear here ready to copy."
          />
        </section>
      </div>
    </AppShell>
  );
}
