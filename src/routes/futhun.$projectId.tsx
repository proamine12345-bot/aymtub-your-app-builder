import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Guard } from "@/components/Guard";
import { fileService, projectService, versionService } from "@/services/data";
import { nextVersion } from "@/services/build";
import { runPipeline } from "@/services/pipeline";
import { relativeTime } from "@/services/data";

export const Route = createFileRoute("/futhun/$projectId")({
  head: () => ({
    meta: [
      { title: "Futhun — ملفات المشروع" },
      {
        name: "description",
        content: "عدّل ملفات مشروع Android داخل Futhun ثم أعد بناء إصدار جديد بضغطة واحدة.",
      },
      { property: "og:title", content: "Futhun — ملفات المشروع" },
      { property: "og:description", content: "تعديل الكود وإعادة البناء داخل AYMTUB." },
    ],
  }),
  component: () => (
    <Guard>
      <FuthunEditor />
    </Guard>
  ),
});

function FuthunEditor() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [tab, setTab] = useState<"files" | "versions">("files");

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.get(projectId),
  });
  const files = useQuery({
    queryKey: ["files", projectId],
    queryFn: () => fileService.list(projectId),
  });
  const versions = useQuery({
    queryKey: ["versions", projectId],
    queryFn: () => versionService.list(projectId),
  });

  const open = (files.data ?? []).find((f) => f.id === openId) ?? null;

  useEffect(() => {
    setDraft(open?.content ?? "");
    setSaved(false);
  }, [openId, open?.content]);

  async function save() {
    if (!open) return;
    await fileService.save(open.id, draft);
    await qc.invalidateQueries({ queryKey: ["files", projectId] });
    setSaved(true);
  }

  async function rebuild() {
    const proj = project.data;
    if (!proj || rebuilding) return;
    setRebuilding(true);
    const version = nextVersion(proj.current_version);
    await runPipeline({
      project: proj,
      prompt: "إعادة بناء بعد تعديل الملفات في Futhun",
      isEdit: true,
      version,
      onChange: async () => {
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["project", projectId] }),
          qc.invalidateQueries({ queryKey: ["versions", projectId] }),
          qc.invalidateQueries({ queryKey: ["messages", projectId] }),
        ]);
      },
    });
    setRebuilding(false);
    await navigate({ to: "/chat/$projectId", params: { projectId }, search: {} });
  }

  return (
    <AppShell
      headerRight={
        <button
          onClick={() => void rebuild()}
          disabled={rebuilding}
          className="rounded-[10px] bg-accent px-2.5 py-1.5 text-[11.5px] font-semibold text-background disabled:opacity-60"
        >
          {rebuilding ? "جارٍ البناء…" : "إعادة بناء"}
        </button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <p className="truncate font-mono text-[13px]">{project.data?.name ?? "…"}</p>
          <span className="font-mono text-[10.5px] text-muted">v{project.data?.current_version}</span>
        </div>

        <div className="mt-3 flex gap-1.5 rounded-[12px] border border-line bg-surface-2 p-1">
          {(["files", "versions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-[9px] py-1.5 text-[12px] ${
                tab === t ? "bg-accent text-background" : "text-muted"
              }`}
            >
              {t === "files" ? "الملفات" : "الإصدارات"}
            </button>
          ))}
        </div>

        {tab === "files" ? (
          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
            {(files.data ?? []).length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-line px-3.5 py-8 text-center text-[12.5px] text-muted">
                لم تُولّد ملفات لهذا المشروع بعد.
              </p>
            ) : null}
            {(files.data ?? []).map((f) => (
              <div key={f.id} className="rounded-[13px] border border-line bg-surface">
                <button
                  onClick={() => setOpenId(openId === f.id ? null : f.id)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-start"
                >
                  <span className="font-mono text-[11px] text-accent">
                    {openId === f.id ? "▾" : "▸"}
                  </span>
                  <span dir="ltr" className="min-w-0 flex-1 truncate font-mono text-[11px]">
                    {f.path}
                  </span>
                  <span className="font-mono text-[9.5px] text-muted">{f.language}</span>
                </button>
                {openId === f.id ? (
                  <div className="border-t border-line p-2.5">
                    <textarea
                      dir="ltr"
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        setSaved(false);
                      }}
                      rows={14}
                      className="w-full resize-y rounded-[10px] border border-line bg-background p-2.5 font-mono text-[11px] leading-relaxed outline-none focus:border-accent/50"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => void save()}
                        className="rounded-[10px] bg-accent px-3 py-1.5 text-[12px] font-semibold text-background"
                      >
                        حفظ
                      </button>
                      {saved ? <span className="text-[11px] text-done">تم الحفظ ✓</span> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
            {(versions.data ?? []).length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-line px-3.5 py-8 text-center text-[12.5px] text-muted">
                لا توجد إصدارات بعد.
              </p>
            ) : null}
            {(versions.data ?? []).map((v) => (
              <div key={v.id} className="rounded-[13px] border border-line bg-surface px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px]">v{v.version}</span>
                  <span
                    className={`font-mono text-[10px] ${
                      v.build_status === "SUCCEEDED" ? "text-done" : "text-amber"
                    }`}
                  >
                    {v.build_status === "SUCCEEDED" ? "نجح البناء" : "قيد البناء"}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{v.changes}</p>
                <p className="mt-1 font-mono text-[10px] text-muted">
                  {relativeTime(v.created_at)}
                  {v.apk_size_mb ? ` · ≈ ${v.apk_size_mb} MB` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
