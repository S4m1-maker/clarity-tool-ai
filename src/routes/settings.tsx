import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { clearHistory, readHistory } from "@/lib/history";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | AiFlow AI Workspace" },
      {
        name: "description",
        content:
          "Manage your default signature, saved results in this browser, and read how AiFlow handles AI output responsibly.",
      },
      { property: "og:title", content: "Settings | AiFlow AI Workspace" },
      {
        property: "og:description",
        content: "Defaults, local storage controls and responsible-AI guidance for AiFlow.",
      },
    ],
  }),
  component: SettingsPage,
});

const SIGNATURE_KEY = "aiflow.signature.v1";

function SettingsPage() {
  const [signature, setSignature] = useState("");
  const [saved, setSaved] = useState(0);
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    setSignature(window.localStorage.getItem(SIGNATURE_KEY) ?? "");
    setSaved(readHistory().length);
    const sync = () => setSaved(readHistory().length);
    window.addEventListener("aiflow:history", sync);
    return () => window.removeEventListener("aiflow:history", sync);
  }, []);

  return (
    <AppShell title="Settings" subtitle="Defaults, stored results and responsible use">
      <div className="grid max-w-3xl gap-4">
        <section className="rounded-2xl border border-border bg-gradient-panel p-6">
          <h2 className="font-display text-sm font-semibold text-card-foreground">
            Default signature
          </h2>
          <p className="mt-1 text-xs text-faint">
            Used as a suggestion when you sign off an email draft.
          </p>
          <input
            value={signature}
            onChange={(event) => setSignature(event.target.value)}
            onBlur={() => {
              window.localStorage.setItem(SIGNATURE_KEY, signature);
              setConfirmation("Signature saved on this device.");
            }}
            placeholder="Alex Rivera, Head of Digital Strategy"
            className="mt-4 w-full rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder-faint focus:border-brand/40 focus:ring-1 focus:ring-brand/30 focus:outline-none"
          />
          {confirmation && <p className="mt-2 text-[11px] text-accent">{confirmation}</p>}
        </section>

        <section className="rounded-2xl border border-border bg-gradient-panel p-6">
          <h2 className="font-display text-sm font-semibold text-card-foreground">
            Saved results
          </h2>
          <p className="mt-1 text-xs text-faint">
            {saved} result{saved === 1 ? "" : "s"} are stored in this browser. Nothing is sent to an
            account, and clearing your browser data removes them.
          </p>
          <button
            onClick={() => {
              clearHistory();
              setConfirmation("All saved results were deleted.");
            }}
            className="mt-4 rounded-lg border border-border px-3 py-2 font-display text-xs text-muted-foreground transition-colors hover:bg-foreground/5"
          >
            Delete all saved results
          </button>
        </section>

        <section className="rounded-2xl border border-brand/25 bg-brand/10 p-6">
          <h2 className="font-display text-sm font-semibold text-card-foreground">
            Responsible use of AI output
          </h2>
          <ul className="mt-3 ml-5 list-disc space-y-2 text-sm text-foreground">
            <li>
              Read every draft before you send it. AI can misstate facts, figures, names and dates.
            </li>
            <li>
              Owners and deadlines in a meeting summary come only from your notes — confirm them
              with the people involved.
            </li>
            <li>
              Research briefings may be out of date or incomplete. Verify anything you will act on
              or quote.
            </li>
            <li>
              Avoid pasting confidential material you are not permitted to process with AI tools.
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
