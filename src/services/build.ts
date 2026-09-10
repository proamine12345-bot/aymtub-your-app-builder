// Build Service contract.
//
// DEV_MODE: MockBuildService simulates the Android build pipeline in the client
// so the journey is testable. It never claims a real APK exists — the UI shows a
// "نسخة تجريبية" marker whenever IS_MOCK_BUILD is true.
//
// A real build server only needs to implement BuildService and stream the same
// stage/progress updates.

import { BUILD_STAGES } from "./quality-ai";

export const IS_MOCK_BUILD = true;

export interface BuildUpdate {
  stageIndex: number;
  elapsedSeconds: number;
  etaSeconds: number;
  done: boolean;
  failed?: boolean;
  apkSizeMb?: number;
}

export interface BuildRequest {
  projectId: string;
  version: string;
  etaSeconds: number;
}

export interface BuildService {
  run(req: BuildRequest, onUpdate: (u: BuildUpdate) => void): { cancel: () => void };
}

export const mockBuildService: BuildService = {
  run(req, onUpdate) {
    let stageIndex = 0;
    let elapsed = 0;
    let cancelled = false;

    const tick = window.setInterval(() => {
      if (cancelled) return;
      elapsed += 1;
      // advance a stage roughly every 2s so the whole run takes ~14s
      const nextStage = Math.min(Math.floor(elapsed / 2), BUILD_STAGES.length);
      stageIndex = nextStage;

      if (stageIndex >= BUILD_STAGES.length) {
        window.clearInterval(tick);
        onUpdate({
          stageIndex: BUILD_STAGES.length,
          elapsedSeconds: elapsed,
          etaSeconds: req.etaSeconds,
          done: true,
          apkSizeMb: Math.round((14 + Math.random() * 10) * 10) / 10,
        });
        return;
      }

      onUpdate({
        stageIndex,
        elapsedSeconds: elapsed,
        etaSeconds: req.etaSeconds,
        done: false,
      });
    }, 1000);

    return {
      cancel: () => {
        cancelled = true;
        window.clearInterval(tick);
      },
    };
  },
};

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function nextVersion(current: string): string {
  const [major, minor] = current.split(".");
  return `${major ?? "1"}.${Number(minor ?? "0") + 1}`;
}
