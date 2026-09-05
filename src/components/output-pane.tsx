import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { FormattedOutput } from "@/components/formatted-output";

export function OutputPane({
  label,
  status,
  text,
  error,
  emptyHint,
}: {
  label: string;
  status: "idle" | "loading" | "ready" | "error";
  text: string;
  error?: string | undefined;
  emptyHint: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-gradient-panel ring-glow flex h-full flex-col overflow-hidden rounded-2xl border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={
              status === "ready"
                ? "dot-signal size-2 shrink-0 rounded-full bg-accent"
                : status === "loading"
                  ? "size-2 shrink-0 animate-pulse rounded-full bg-brand"
                  : "size-2 shrink-0 rounded-full bg-muted-foreground/40"
            }
          />
          <span className="truncate font-display text-xs text-muted-foreground">{label}</span>
        </div>
        {status === "ready" && (
          <button
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-foreground/10 px-3 py-1.5 text-xs text-card-foreground transition-colors hover:bg-foreground/15"
          >
            {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy to clipboard"}
          </button>
        )}
      </div>

      <div className="flex-1 p-6">
        {status === "loading" && (
          <div className="space-y-3">
            {[92, 78, 84, 60, 88, 45].map((width, index) => (
              <div
                key={index}
                className="h-3 animate-pulse rounded-full bg-foreground/10"
                style={{ width: `${width}%`, animationDelay: `${index * 90}ms` }}
              />
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive">
            {error ?? "Something went wrong. Please try again."}
          </p>
        )}

        {status === "idle" && <p className="text-sm text-faint">{emptyHint}</p>}

        {status === "ready" && <FormattedOutput text={text} />}
      </div>
    </div>
  );
}
