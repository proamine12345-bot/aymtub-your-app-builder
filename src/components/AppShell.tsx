import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/home", label: "الرئيسية", glyph: "◫" },
  { to: "/projects", label: "المشاريع", glyph: "▤" },
  { to: "/futhun", label: "Futhun", glyph: "▣", mono: true },
  { to: "/settings", label: "الإعدادات", glyph: "⚙" },
] as const;

export function AppHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="relative border-b border-line px-4 pb-3 pt-5">
      <div className="flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[9px] border border-accent/30 bg-accent/15 font-display text-[13px] font-bold leading-none text-accent">
            A
          </span>
          <span className="block">
            <span className="block font-display text-[15px] font-bold leading-none tracking-tight">
              AYMTUB
            </span>
            <span className="mt-0.5 block font-mono text-[10px] text-muted">DEV·CONSOLE</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2.5">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 ${active ? "text-accent" : "text-muted"}`}
            >
              <span className="text-[16px] leading-none">{item.glyph}</span>
              <span className={`text-[10px] ${item.mono ? "font-mono" : ""} ${active ? "font-medium" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({
  children,
  header,
  headerRight,
}: {
  children: ReactNode;
  header?: ReactNode;
  headerRight?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <div className="grain pointer-events-none fixed inset-0 z-0 opacity-[0.05]" aria-hidden />
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        {header ?? <AppHeader right={headerRight} />}
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}

export function QualityAiBadge({ subtitle }: { subtitle?: string }) {
  return (
    <div className="riso-in flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface-2 text-[15px] leading-none text-accent">
        ◈
      </span>
      <span className="block">
        <span className="block font-mono text-[13px] font-medium leading-none">Quality_ai</span>
        <span className="mt-1 block text-[10.5px] text-muted">
          {subtitle ?? "مساعدك لبناء تطبيقات وألعاب Android"}
        </span>
      </span>
    </div>
  );
}

export function StageRow({ label, state }: { label: string; state: string }) {
  const glyph = state === "done" ? "✓" : state === "running" ? "⏳" : state === "failed" ? "✕" : "○";
  const tone =
    state === "done"
      ? "text-done"
      : state === "running"
        ? "text-amber"
        : state === "failed"
          ? "text-destructive"
          : "text-muted";
  return (
    <div className="flex items-center gap-2 text-[12.5px]">
      <span className={tone}>{glyph}</span>
      <span className={state === "waiting" ? "text-muted" : "text-foreground/85"}>{label}</span>
      <span className="me-0 ms-auto text-[10px] text-muted">
        {state === "done"
          ? "مكتمل"
          : state === "running"
            ? "قيد التنفيذ"
            : state === "failed"
              ? "فشل"
              : "في الانتظار"}
      </span>
    </div>
  );
}
