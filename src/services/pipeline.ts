// Quality_ai run pipeline:
// User Prompt -> Quality_ai -> Planner -> Code Generator -> File Manager ->
// Validator -> Build Service -> APK.
//
// DEV_MODE: planner/generator/build are mock implementations (see quality-ai.ts
// and build.ts). Swapping them for real services does not change this pipeline.

import { chatService, fileService, notificationService, projectService, versionService } from "./data";
import { mockBuildService } from "./build";
import { allStagesDone, mockQualityAi, progressMeta, stagesAt } from "./quality-ai";
import type { Project } from "./types";

export interface RunHandle {
  cancel: () => void;
}

export async function runPipeline(opts: {
  project: Project;
  prompt: string;
  isEdit: boolean;
  version: string;
  onChange: () => void | Promise<void>;
}): Promise<RunHandle> {
  const { project, prompt, isEdit, version, onChange } = opts;

  const plan = await mockQualityAi.plan(prompt, isEdit ? project.name : undefined);

  await chatService.add(
    project.id,
    "assistant",
    isEdit ? "فهمت التعديل. سأحدّث المشروع الآن." : "فهمت طلبك. سأبدأ الآن في بناء المشروع.",
    { kind: "plan", plan: plan.steps },
  );
  await onChange();

  const progress = await chatService.add(project.id, "assistant", "Quality_ai يعمل الآن...", {
    ...progressMeta(0, 0, plan.etaSeconds),
  });
  await projectService.update(project.id, { status: "GENERATING", build_status: "RUNNING" });
  await onChange();

  let cancelled = false;

  const run = mockBuildService.run(
    { projectId: project.id, version, etaSeconds: plan.etaSeconds },
    (update) => {
      if (cancelled) return;
      void (async () => {
        if (!update.done) {
          await chatService.updateMeta(progress.id, {
            kind: "progress",
            stages: stagesAt(update.stageIndex),
            elapsedSeconds: update.elapsedSeconds,
            etaSeconds: update.etaSeconds,
          });
          await onChange();
          return;
        }

        const files = await mockQualityAi.generateFiles(plan);
        await fileService.upsertMany(project.id, files);
        await chatService.updateMeta(progress.id, {
          kind: "progress",
          stages: allStagesDone(),
          elapsedSeconds: update.elapsedSeconds,
          etaSeconds: update.etaSeconds,
        });
        await projectService.update(project.id, {
          status: "COMPLETED",
          build_status: "SUCCEEDED",
          current_version: version,
          apk_size_mb: update.apkSizeMb ?? 0,
        });
        await versionService.add({
          projectId: project.id,
          version,
          changes: isEdit ? prompt : plan.steps.join(" · "),
          build_status: "SUCCEEDED",
          apk_size_mb: update.apkSizeMb ?? 0,
        });
        await chatService.add(
          project.id,
          "assistant",
          isEdit ? "تم تحديث المشروع." : "اكتمل إنشاء المشروع بنجاح.",
          {
            kind: "result",
            version,
            apkSizeMb: update.apkSizeMb ?? 0,
          },
        );
        await notificationService.add({
          projectId: project.id,
          title: "اكتمل مشروعك",
          body: `${project.name} — الإصدار ${version} جاهز للمعاينة والتنزيل.`,
        });
        await onChange();
      })();
    },
  );

  return {
    cancel: () => {
      cancelled = true;
      run.cancel();
      void projectService.update(project.id, { status: "CANCELLED", build_status: "FAILED" });
    },
  };
}
