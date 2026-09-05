import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { OutputPane } from "@/components/output-pane";
import { researchBrief } from "@/lib/ai.functions";
import { addHistory } from "@/lib/history";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | Vellum AI Workspace" },
      {
        name: "description",
        content:
          "Summarize articles, reports and complex topics into key takeaways, plain-English explanations and strategic recommendations.",
      },
      { property: "og:title", content: "AI Research Assistant | Vellum AI Workspace" },
      {
        property: "og:description",
        content:
          "Key takeaways, plain-English explanations and strategic recommendations from any article or topic.",
      },
    ],
  }),
  component: ResearchTool,
});

function ResearchTool() {
  const run = useServerFn(researchBrief);
  const [source, setSource] = useState("");
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const generate = async () => {
    if (!source.trim() || status === "loading") return;
    setStatus("loading");
    setError(undefined);
    try {
      const result = await run({
        data: { source: source.trim(), ...(goal.trim() ? { goal: goal.trim() } : {}) },
      });
      setOutput(result.text);
      setStatus("ready");
      addHistory({
        tool: "research",
        title: goal.trim() || source.trim().slice(0, 60),
        meta: "Research briefing",
        input: source.trim(),
        output: result.text,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Research failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <AppShell
      title="AI Research Assistant"
      subtitle="Articles, reports and topics turned into decision-ready insight"
      action={
        <button
          onClick={generate}
          disabled={!source.trim() || status === "loading"}
          className="ring-glow shrink-0 rounded-lg bg-gradient-brand px-4 py-2 font-display text-sm font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {status === "loading" ? "Analyzing…" : "Build briefing"}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-5">
          <div>
            <label className="font-display text-xs font-medium text-muted-foreground">
              What are you deciding? (optional)
            </label>
            <input
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Whether to move our billing to usage-based pricing"
              className="mt-2 w-full rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder-faint focus:border-brand/40 focus:ring-1 focus:ring-brand/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-display text-xs font-medium text-muted-foreground">
              Article, report text, or a topic
            </label>
            <textarea
              rows={16}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Paste the full article or report text, or simply name the topic you need to understand."
              className="mt-2 w-full resize-none rounded-xl border border-border bg-foreground/5 p-4 text-sm text-foreground placeholder-faint focus:border-brand/40 focus:ring-1 focus:ring-brand/30 focus:outline-none"
            />
            <p className="mt-2 text-[11px] text-faint">
              Pasting the source text gives the most accurate briefing.
            </p>
          </div>
        </section>

        <section className="lg:col-span-7">
          <OutputPane
            label={status === "ready" ? "Briefing · ready to copy" : "Briefing output"}
            status={status}
            text={output}
            error={error}
            emptyHint="Paste an article or name a topic to get a summary, key takeaways, a plain-English explanation and recommendations."
          />
        </section>
      </div>
    </AppShell>
  );
}
