import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { OutputPane } from "@/components/output-pane";
import { summarizeMeeting } from "@/lib/ai.functions";
import { addHistory } from "@/lib/history";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Vellum AI Workspace" },
      {
        name: "description",
        content:
          "Turn long meeting transcripts into an executive summary with decisions, action items, owners and deadlines.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer | Vellum AI Workspace" },
      {
        property: "og:description",
        content:
          "Executive summaries with decisions, action items, owners and deadlines from raw meeting notes.",
      },
    ],
  }),
  component: MeetingsTool,
});

function MeetingsTool() {
  const run = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [context, setContext] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const generate = async () => {
    if (!notes.trim() || status === "loading") return;
    setStatus("loading");
    setError(undefined);
    try {
      const result = await run({
        data: {
          notes: notes.trim(),
          ...(context.trim() ? { context: context.trim() } : {}),
        },
      });
      setOutput(result.text);
      setStatus("ready");
      addHistory({
        tool: "meetings",
        title: context.trim() || "Meeting summary",
        meta: `${notes.trim().split(/\s+/).length} words in`,
        input: notes.trim(),
        output: result.text,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Summarizing failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <AppShell
      title="Meeting Notes Summarizer"
      subtitle="Decisions, owners and deadlines pulled out of raw notes"
      action={
        <button
          onClick={generate}
          disabled={!notes.trim() || status === "loading"}
          className="ring-glow shrink-0 rounded-lg bg-gradient-brand px-4 py-2 font-display text-sm font-medium text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {status === "loading" ? "Summarizing…" : "Summarize notes"}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-5">
          <div>
            <label className="font-display text-xs font-medium text-muted-foreground">
              Meeting context (optional)
            </label>
            <input
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Q3 planning review · Product and Sales"
              className="mt-2 w-full rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder-faint focus:border-brand/40 focus:ring-1 focus:ring-brand/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-display text-xs font-medium text-muted-foreground">
              Transcript or raw notes
            </label>
            <textarea
              rows={16}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Paste the full transcript or your rough notes. Half-sentences, timestamps and speaker labels are all fine."
              className="mt-2 w-full resize-none rounded-xl border border-border bg-foreground/5 p-4 text-sm text-foreground placeholder-faint focus:border-brand/40 focus:ring-1 focus:ring-brand/30 focus:outline-none"
            />
            <p className="mt-2 text-[11px] text-faint">
              Owners and dates are only extracted when the notes actually state them.
            </p>
          </div>
        </section>

        <section className="lg:col-span-7">
          <OutputPane
            label={status === "ready" ? "Executive record · ready to copy" : "Summary output"}
            status={status}
            text={output}
            error={error}
            emptyHint="Paste your meeting notes to get a summary, the decisions made, and a task list with owners and deadlines."
          />
        </section>
      </div>
    </AppShell>
  );
}
