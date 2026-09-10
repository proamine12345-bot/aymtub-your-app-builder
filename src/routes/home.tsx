import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, QualityAiBadge } from "@/components/AppShell";
import { Guard } from "@/components/Guard";
import { notificationService, projectService, relativeTime } from "@/services/data";
import { mockQualityAi } from "@/services/quality-ai";
import { STATUS_LABEL } from "@/services/types";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية — AYMTUB" },
      {
        name: "description",
        content: "اكتب فكرتك ودع Quality_ai يبني لك تطبيق أو لعبة Android خطوة بخطوة.",
      },
      { property: "og:title", content: "الرئيسية — AYMTUB" },
      { property: "og:description", content: "اكتب فكرتك ودع Quality_ai يبني مشروعك." },
    ],
  }),
  component: () => (
    <Guard>
      <HomeScreen />
    </Guard>
  ),
});

const IDEAS = [
  "أنشئ تطبيق ملاحظات بسيط",
  "أنشئ لعبة سيارات ثلاثية الأبعاد",
  "أنشئ تطبيق مهام مع تسجيل دخول",
];

function HomeScreen() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const projects = useQuery({ queryKey: ["projects"], queryFn: projectService.list });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: notificationService.list });
  const unread = (notifications.data ?? []).filter((n) => !n.read).length;

  async function start(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      const plan = await mockQualityAi.plan(value);
      const project = await projectService.create({
        name: plan.projectName,
        description: value,
        type: plan.projectType,
      });
      await navigate({ to: "/chat/$projectId", params: { projectId: project.id }, search: { run: value } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      headerRight={
        <span className="relative grid size-8 place-items-center rounded-[9px] border border-line bg-surface-2 text-[13px] text-muted">
          ⌁
          {unread > 0 ? (
            <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-accent font-mono text-[9px] text-background">
              {unread}
            </span>
          ) : null}
        </span>
      }
    >
      <div className="flex-1 space-y-6 px-4 pb-8 pt-5">
        <QualityAiBadge />

        <section className="riso-in rounded-[18px] border border-line bg-surface p-4">
          <h1 className="text-[17px] font-semibold leading-snug">ماذا تريد أن تبني اليوم؟</h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            اكتب فكرتك بالعربية، وسيقوم Quality_ai بالتخطيط وكتابة الكود وتجهيز المشروع.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="مثال: أنشئ لي تطبيق ملاحظات بسيط…"
            className="mt-3.5 w-full resize-none rounded-[14px] border border-line bg-surface-2 px-3.5 py-3 text-[13.5px] leading-relaxed outline-none placeholder:text-muted focus:border-accent/50"
          />
          <button
            onClick={() => void start(prompt)}
            disabled={busy || prompt.trim() === ""}
            className="mt-3 w-full rounded-[14px] bg-accent py-3 text-[13.5px] font-semibold text-background disabled:opacity-50"
          >
            {busy ? "جارٍ التحضير…" : "ابدأ البناء"}
          </button>
        </section>

        <section>
          <h2 className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-muted">
            أفكار سريعة
          </h2>
          <div className="space-y-2">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                onClick={() => setPrompt(idea)}
                className="w-full rounded-[14px] border border-line bg-surface-2 px-3.5 py-3 text-start text-[12.5px]"
              >
                {idea}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-muted">
            مشاريعي الأخيرة
          </h2>
          {(projects.data ?? []).length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-line px-3.5 py-6 text-center text-[12.5px] text-muted">
              لا توجد مشاريع بعد. ابدأ بفكرتك الأولى.
            </p>
          ) : (
            <div className="space-y-2">
              {(projects.data ?? []).slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    void navigate({ to: "/chat/$projectId", params: { projectId: p.id } })
                  }
                  className="flex w-full items-center gap-3 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-start"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-[14px]">
                    {p.type === "game" ? "◕" : "◫"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{p.name}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-muted">
                      v{p.current_version} · {relativeTime(p.updated_at)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
                      p.status === "COMPLETED"
                        ? "border-done/40 text-done"
                        : p.status === "FAILED" || p.status === "CANCELLED"
                          ? "border-destructive/40 text-destructive"
                          : "border-amber/40 text-amber"
                    }`}
                  >
                    {STATUS_LABEL[p.status]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
