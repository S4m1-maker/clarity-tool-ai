import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { readHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

const TOOLS = [
  { to: "/", glyph: "✉", label: "Email Generator" },
  { to: "/meetings", glyph: "◫", label: "Meeting Summarizer" },
  { to: "/research", glyph: "✦", label: "Research Assistant" },
] as const;

const WORKSPACE = [
  { to: "/history", glyph: "↺", label: "History" },
  { to: "/settings", glyph: "⚙", label: "Settings" },
] as const;

function NavItem({
  to,
  glyph,
  label,
  active,
  onNavigate,
}: {
  to: string;
  glyph: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        active
          ? "ring-glow border border-brand/30 bg-brand/15 text-card-foreground"
          : "text-muted-foreground hover:bg-foreground/5",
      )}
    >
      <span className="text-base leading-none">{glyph}</span>
      <span className="font-display text-sm font-medium">{label}</span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [saved, setSaved] = useState(0);

  useEffect(() => {
    const sync = () => setSaved(readHistory().length);
    sync();
    window.addEventListener("vellum:history", sync);
    return () => window.removeEventListener("vellum:history", sync);
  }, []);

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="bg-gradient-brand ring-glow grid size-9 place-items-center rounded-lg">
          <span className="font-display text-sm font-bold text-brand-foreground">V</span>
        </div>
        <div>
          <p className="font-display leading-none font-semibold text-card-foreground">Vellum</p>
          <p className="mt-1 text-[10px] tracking-widest text-faint uppercase">AI Workspace</p>
        </div>
      </div>

      <nav className="mt-4 space-y-1 px-3">
        <p className="px-3 pb-2 text-[10px] tracking-[0.2em] text-faint uppercase">Tools</p>
        {TOOLS.map((item) => (
          <NavItem key={item.to} {...item} active={pathname === item.to} onNavigate={onNavigate} />
        ))}
        <p className="px-3 pt-5 pb-2 text-[10px] tracking-[0.2em] text-faint uppercase">
          Workspace
        </p>
        {WORKSPACE.map((item) => (
          <NavItem key={item.to} {...item} active={pathname === item.to} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto p-3">
        <div className="rounded-xl border border-border bg-foreground/5 p-4">
          <p className="font-display text-xs font-medium text-foreground">Saved on this device</p>
          <p className="mt-1 text-[11px] text-faint">
            {saved} of 60 recent results kept in this browser
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="bg-gradient-brand h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((saved / 60) * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen overflow-hidden">
        <aside className="bg-gradient-rail hidden w-64 shrink-0 flex-col border-r border-sidebar-border md:flex">
          <SidebarBody />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="absolute inset-0 bg-background/80"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside className="bg-gradient-rail relative flex w-64 flex-col border-r border-sidebar-border">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="absolute top-5 right-4 text-muted-foreground"
              >
                <X className="size-4" />
              </button>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-border bg-background/60 px-4 py-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
                className="text-muted-foreground md:hidden"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-glow truncate font-display text-lg font-semibold text-card-foreground md:text-xl">
                  {title}
                </h1>
                <p className="mt-0.5 truncate text-xs text-faint">{subtitle}</p>
              </div>
            </div>
            {action}
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>

          <footer className="flex items-center gap-3 border-t border-border bg-background/80 px-4 py-3 md:px-6">
            <span className="grid size-6 shrink-0 place-items-center rounded-md border border-brand/30 bg-brand/15 text-xs">
              ⚠
            </span>
            <p className="text-[11px] text-faint">
              AI-generated content should be reviewed by a human before sending or publishing.
              Vellum does not verify factual accuracy.
            </p>
            <Link
              to="/settings"
              className="ml-auto shrink-0 text-[11px] text-brand underline underline-offset-2 hover:text-card-foreground"
            >
              Learn more
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
