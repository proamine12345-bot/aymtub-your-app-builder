import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Guard } from "@/components/Guard";
import { projectService, relativeTime } from "@/services/data";
import { STATUS_LABEL } from "@/services/types";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "مشاريعي — AYMTUB" },
      {
        name: "description",
        content: "كل مشاريعك في AYMTUB: الحالة، الإصدار، وآخر تحديث، مع محادثة كل مشروع.",
      },
      { property: "og:title", content: "مشاريعي — AYMTUB" },
      { property: "og:description", content: "تابع مشاريع Android الخاصة بك وإصداراتها." },
    ],
  }),
  component: () => (
    <Guard>
      <ProjectsScreen />
    </Guard>
  ),
});

function ProjectsScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: ["projects"], queryFn: projectService.list });

  async function remove(id: string) {
    await projectService.remove(id);
    await qc.invalidateQueries({ queryKey: ["projects"] });
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-3 px-4 pb-8 pt-5">
        <h1 className="text-[17px] font-semibold">مشاريعي</h1>
        <p className="text-[12px] text-muted">
          كل مشروع يحتفظ بمحادثته وملفاته وإصداراته.
        </p>

        {(projects.data ?? []).length === 0 ? (
          <p className="mt-4 rounded-[14px] border border-dashed border-line px-3.5 py-8 text-center text-[12.5px] text-muted">
            لا توجد مشاريع بعد.
          </p>
        ) : (
          <div className="space-y-2.5 pt-1">
            {(projects.data ?? []).map((p) => (
              <div key={p.id} className="rounded-[16px] border border-line bg-surface p-3.5">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-[14px]">
                    {p.type === "game" ? "◕" : "◫"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{p.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                      {p.description}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] text-muted">
                      v{p.current_version} · {relativeTime(p.updated_at)}
                    </p>
                  </div>
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
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      void navigate({
                        to: "/chat/$projectId",
                        params: { projectId: p.id },
                        search: {},
                      })
                    }
                    className="flex-1 rounded-[11px] border border-line bg-surface-2 py-2 text-[12px]"
                  >
                    المحادثة
                  </button>
                  <button
                    onClick={() =>
                      void navigate({ to: "/futhun/$projectId", params: { projectId: p.id } })
                    }
                    className="flex-1 rounded-[11px] border border-line bg-surface-2 py-2 font-mono text-[11.5px]"
                  >
                    Futhun
                  </button>
                  <button
                    onClick={() => void remove(p.id)}
                    className="rounded-[11px] border border-destructive/30 px-3 py-2 text-[12px] text-destructive"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
