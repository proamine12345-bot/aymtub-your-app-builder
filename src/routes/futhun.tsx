import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Guard } from "@/components/Guard";
import { projectService, relativeTime } from "@/services/data";

export const Route = createFileRoute("/futhun")({
  head: () => ({
    meta: [
      { title: "Futhun — محرر ملفات المشروع" },
      {
        name: "description",
        content: "Futhun هو محرر ملفات AYMTUB: استعرض بنية مشروع Android وعدّل الكود مباشرة.",
      },
      { property: "og:title", content: "Futhun — محرر ملفات المشروع" },
      { property: "og:description", content: "استعرض وعدّل ملفات مشروع Android داخل AYMTUB." },
    ],
  }),
  component: () => (
    <Guard>
      <FuthunIndex />
    </Guard>
  ),
});

function FuthunIndex() {
  const navigate = useNavigate();
  const projects = useQuery({ queryKey: ["projects"], queryFn: projectService.list });

  return (
    <AppShell>
      <div className="flex-1 space-y-3 px-4 pb-8 pt-5">
        <h1 className="font-mono text-[17px] font-medium">Futhun</h1>
        <p className="text-[12px] leading-relaxed text-muted">
          محرر الملفات. اختر مشروعًا لعرض بنية ملفاته وتعديل الكود.
        </p>

        {(projects.data ?? []).length === 0 ? (
          <p className="mt-4 rounded-[14px] border border-dashed border-line px-3.5 py-8 text-center text-[12.5px] text-muted">
            لا توجد مشاريع لعرض ملفاتها بعد.
          </p>
        ) : (
          <div className="space-y-2 pt-1">
            {(projects.data ?? []).map((p) => (
              <button
                key={p.id}
                onClick={() => void navigate({ to: "/futhun/$projectId", params: { projectId: p.id } })}
                className="flex w-full items-center gap-3 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-start"
              >
                <span className="grid size-9 place-items-center rounded-[10px] bg-surface-2 font-mono text-[12px] text-accent">
                  {"</>"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{p.name}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-muted">
                    v{p.current_version} · {relativeTime(p.updated_at)}
                  </span>
                </span>
                <span className="text-[13px] text-muted">‹</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
