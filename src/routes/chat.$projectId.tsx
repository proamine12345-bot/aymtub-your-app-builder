import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell, QualityAiBadge, StageRow } from "@/components/AppShell";
import { Guard } from "@/components/Guard";
import { chatService, projectService } from "@/services/data";
import { formatClock, IS_MOCK_BUILD, nextVersion } from "@/services/build";
import { isEditPrompt } from "@/services/quality-ai";
import { runPipeline } from "@/services/pipeline";
import type { ChatMessage, Project } from "@/services/types";

export const Route = createFileRoute("/chat/$projectId")({
  head: () => ({
    meta: [
      { title: "محادثة Quality_ai — AYMTUB" },
      {
        name: "description",
        content: "تابع مراحل بناء مشروعك مع Quality_ai: التخطيط، الكود، الفحص، ثم تجهيز APK.",
      },
      { property: "og:title", content: "محادثة Quality_ai — AYMTUB" },
      { property: "og:description", content: "تابع مراحل بناء مشروع Android خطوة بخطوة." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { run?: string } =>
    typeof search['run'] === "string" ? { run: search['run'] as string } : {},
  component: () => (
    <Guard>
      <ChatScreen />
    </Guard>
  ),
});

function ChatScreen() {
  const { projectId } = Route.useParams();
  const { run } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.get(projectId),
  });
  const messages = useQuery({
    queryKey: ["messages", projectId],
    queryFn: () => chatService.list(projectId),
  });

  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["messages", projectId] }),
      qc.invalidateQueries({ queryKey: ["project", projectId] }),
      qc.invalidateQueries({ queryKey: ["projects"] }),
      qc.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
  };

  async function launch(prompt: string, proj: Project) {
    setRunning(true);
    const isEdit = isEditPrompt(prompt) && proj.status === "COMPLETED";
    const version = isEdit ? nextVersion(proj.current_version) : proj.current_version;
    await chatService.add(projectId, "user", prompt);
    await refresh();
    await runPipeline({ project: proj, prompt, isEdit, version, onChange: refresh });
    setRunning(false);
  }

  // Auto-run the first prompt handed over from the home screen.
  useEffect(() => {
    if (started.current || !run || !project.data) return;
    started.current = true;
    void (async () => {
      await launch(run, project.data as Project);
      await navigate({ to: "/chat/$projectId", params: { projectId }, search: {}, replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, project.data]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  const list = messages.data ?? [];
  const proj = project.data;

  return (
    <AppShell
      headerRight={
        proj ? (
          <button
            onClick={() => void navigate({ to: "/preview/$projectId", params: { projectId } })}
            className="rounded-[10px] border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[10.5px] text-muted"
          >
            v{proj.current_version}
          </button>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-4">
          <QualityAiBadge subtitle={proj ? proj.name : "جارٍ التحميل…"} />
          {IS_MOCK_BUILD ? (
            <p className="rounded-[12px] border border-amber/30 bg-amber/10 px-3 py-2 text-[11px] leading-relaxed text-amber">
              نسخة تجريبية: البناء وملف APK محاكاة داخل التطبيق (Mock Build). عند ربط سيرفر البناء
              الحقيقي سيصبح التنزيل فعليًا.
            </p>
          ) : null}

          {list.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}

          {list.length === 0 ? (
            <p className="pt-6 text-center text-[12.5px] text-muted">
              اكتب طلبك وسيبدأ Quality_ai في التخطيط والبناء.
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        {proj?.status === "COMPLETED" ? (
          <div className="flex gap-2 border-t border-line px-4 py-3">
            <button
              onClick={() => void navigate({ to: "/preview/$projectId", params: { projectId } })}
              className="flex-1 rounded-[12px] bg-accent py-2.5 text-[12.5px] font-semibold text-background"
            >
              معاينة وتنزيل
            </button>
            <button
              onClick={() => void navigate({ to: "/futhun/$projectId", params: { projectId } })}
              className="flex-1 rounded-[12px] border border-line bg-surface-2 py-2.5 font-mono text-[12px]"
            >
              Futhun
            </button>
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = input.trim();
            if (!value || running || !proj) return;
            setInput("");
            void launch(value, proj);
          }}
          className="border-t border-line px-4 pb-4 pt-3"
        >
          <div className="flex items-end gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={running ? "Quality_ai يعمل الآن…" : "اكتب طلبك أو تعديلك…"}
              disabled={running}
              className="min-w-0 flex-1 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[13px] outline-none placeholder:text-muted focus:border-accent/50 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={running || input.trim() === ""}
              className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-accent text-[15px] text-background disabled:opacity-50"
              aria-label="إرسال"
            >
              ↑
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const meta = message.meta ?? {};

  if (message.role === "user") {
    return (
      <div className="riso-in flex justify-start">
        <p className="max-w-[86%] rounded-[16px] rounded-ss-md border border-accent/25 bg-accent/12 px-3.5 py-2.5 text-[13px] leading-relaxed">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="riso-in space-y-2.5 rounded-[16px] border border-line bg-surface px-3.5 py-3">
      <p className="text-[13px] leading-relaxed">{message.content}</p>

      {meta.kind === "plan" && meta.plan ? (
        <ul className="space-y-1.5 border-t border-line pt-2.5">
          {meta.plan.map((step) => (
            <li key={step} className="flex items-center gap-2 text-[12.5px] text-foreground/85">
              <span className="text-accent">•</span>
              {step}
            </li>
          ))}
        </ul>
      ) : null}

      {meta.kind === "progress" && meta.stages ? (
        <div className="space-y-1.5 border-t border-line pt-2.5">
          {meta.stages.map((s) => (
            <StageRow key={s.key} label={s.label} state={s.state} />
          ))}
          <div className="flex items-center justify-between pt-1.5 font-mono text-[10.5px] text-muted">
            <span>المستغرق {formatClock(meta.elapsedSeconds ?? 0)}</span>
            <span>
              المتوقع ≈{" "}
              {(meta.etaSeconds ?? 0) < 60
                ? `${meta.etaSeconds ?? 0} ثانية`
                : `${Math.round((meta.etaSeconds ?? 0) / 60)} دقيقة`}
            </span>
          </div>
        </div>
      ) : null}

      {meta.kind === "result" ? (
        <div className="space-y-1 border-t border-line pt-2.5 font-mono text-[11px] text-muted">
          <p>الإصدار {meta.version}</p>
          <p>حجم APK التجريبي ≈ {meta.apkSizeMb} MB</p>
        </div>
      ) : null}
    </div>
  );
}
