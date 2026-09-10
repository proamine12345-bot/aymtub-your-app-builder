// Shared domain types for AYMTUB / Quality_ai.
// These types are the contract between the UI and the services layer, so a
// mock service can be swapped for a real AI / build backend without UI changes.

export type ProjectStatus =
  | "DRAFT"
  | "PLANNING"
  | "GENERATING"
  | "VALIDATING"
  | "BUILDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type BuildStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type ProjectType = "app" | "game";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: ProjectType;
  status: ProjectStatus;
  build_status: BuildStatus;
  current_version: string;
  apk_url: string | null;
  apk_size_mb: number | null;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant";

export interface StageState {
  key: string;
  label: string;
  state: "done" | "running" | "waiting" | "failed";
}

export interface MessageMeta {
  kind?: "plan" | "progress" | "result" | "error" | "text";
  plan?: string[];
  stages?: StageState[];
  etaSeconds?: number;
  elapsedSeconds?: number;
  version?: string;
  apkSizeMb?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  meta: MessageMeta;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  language: string | null;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version: string;
  changes: string | null;
  build_status: BuildStatus;
  apk_size_mb: number | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: string;
  language: string;
  notifications_enabled: boolean;
  ai_provider: string;
  ai_model: string | null;
  ai_endpoint: string | null;
  /** true when a key is stored. The key value itself is never returned to the UI. */
  ai_key_set: boolean;
}

export interface AppNotification {
  id: string;
  project_id: string | null;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: "مسودة",
  PLANNING: "قيد التخطيط",
  GENERATING: "قيد التوليد",
  VALIDATING: "قيد الفحص",
  BUILDING: "قيد البناء",
  COMPLETED: "مكتمل",
  FAILED: "فشل",
  CANCELLED: "أُلغي",
};
