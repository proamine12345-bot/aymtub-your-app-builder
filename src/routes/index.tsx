import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AYMTUB — ابنِ تطبيقك من فكرتك" },
      {
        name: "description",
        content:
          "AYMTUB منصة عربية لإنشاء تطبيقات وألعاب Android عبر محادثة مع المساعد الذكي Quality_ai.",
      },
      { property: "og:title", content: "AYMTUB — ابنِ تطبيقك من فكرتك" },
      {
        property: "og:description",
        content: "أنشئ تطبيقات وألعاب Android باستخدام الذكاء الاصطناعي مع Quality_ai.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => {
      void navigate({ to: user ? "/home" : "/auth" });
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [loading, user, navigate]);

  return (
    <div className="relative grid min-h-[100dvh] place-items-center bg-background text-foreground">
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden />
      <div className="riso-in relative text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-accent/30 bg-accent/15 font-display text-xl font-bold text-accent">
          A
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">AYMTUB</h1>
        <p className="mt-2 text-[13px] text-muted">ابنِ تطبيقك من فكرتك</p>
        <p className="mt-8 font-mono text-[10px] text-muted">Quality_ai · DEV·CONSOLE</p>
      </div>
    </div>
  );
}
