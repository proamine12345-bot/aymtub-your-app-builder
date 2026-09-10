import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Guard } from "@/components/Guard";
import { fileService, projectService } from "@/services/data";
import { IS_MOCK_BUILD } from "@/services/build";

export const Route = createFileRoute("/preview/$projectId")({
  head: () => ({
    meta: [
      { title: "معاينة المشروع — AYMTUB" },
      {
        name: "description",
        content: "عاين شكل تطبيقك الناتج وتفاصيل الإصدار وملف APK قبل التنزيل.",
      },
      { property: "og:title", content: "معاينة المشروع — AYMTUB" },
      { property: "og:description", content: "معاينة تطبيق Android الناتج وتفاصيل الإصدار." },
    ],
  }),
  component: () => (
    <Guard>
      <PreviewScreen />
    </Guard>
  ),
});

function PreviewScreen() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.get(projectId),
  });
  const files = useQuery({
    queryKey: ["files", projectId],
    queryFn: () => fileService.list(projectId),
  });

  const p = project.data;

  return (
    <AppShell>
      <div className="flex-1 space-y-4 px-4 pb-8 pt-5">
        <div>
          <h1 className="text-[17px] font-semibold">{p?.name ?? "…"}</h1>
          <p className="mt-1 font-mono text-[10.5px] text-muted">
            v{p?.current_version} · {p?.type === "game" ? "لعبة" : "تطبيق"} ·{" "}
            {(files.data ?? []).length} ملف
          </p>
        </div>

        <div className="riso-in rounded-[20px] border border-line bg-surface p-3">
          <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-[18px] border border-line bg-background">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="text-[10.5px] font-medium">{p?.name}</span>
              <span className="font-mono text-[9px] text-muted">9:41</span>
            </div>
            <div className="space-y-2 p-3">
              <div className="h-16 rounded-[10px] bg-accent/15" />
              <div className="h-3 w-2/3 rounded bg-surface-2" />
              <div className="h-3 w-1/2 rounded bg-surface-2" />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="h-12 rounded-[10px] bg-surface-2" />
                <div className="h-12 rounded-[10px] bg-surface-2" />
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted">
            معاينة تقريبية لشكل الواجهة الناتجة
          </p>
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">ملف APK</span>
            <span className="font-mono text-[11px] text-muted">
              {p?.apk_size_mb ? `≈ ${p.apk_size_mb} MB` : "—"}
            </span>
          </div>
          {IS_MOCK_BUILD ? (
            <p className="mt-2.5 rounded-[11px] border border-amber/30 bg-amber/10 px-3 py-2 text-[11px] leading-relaxed text-amber">
              نسخة تجريبية: لم يُنتج ملف APK حقيقي بعد. هذه محاكاة لسيرفر البناء (Mock Build Service)
              حتى يتم ربط سيرفر Gradle الحقيقي.
            </p>
          ) : null}
          <button
            disabled={IS_MOCK_BUILD}
            className="mt-3 w-full rounded-[13px] bg-accent py-2.5 text-[12.5px] font-semibold text-background disabled:opacity-45"
          >
            تنزيل APK
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              void navigate({ to: "/chat/$projectId", params: { projectId }, search: {} })
            }
            className="flex-1 rounded-[13px] border border-line bg-surface-2 py-2.5 text-[12.5px]"
          >
            العودة للمحادثة
          </button>
          <button
            onClick={() => void navigate({ to: "/futhun/$projectId", params: { projectId } })}
            className="flex-1 rounded-[13px] border border-line bg-surface-2 py-2.5 font-mono text-[12px]"
          >
            Futhun
          </button>
        </div>
      </div>
    </AppShell>
  );
}
