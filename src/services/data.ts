// Data services: Project / Chat / File / Version / Settings / Notification.
// Every call is scoped to the signed-in user by row-level security.

import { supabase } from "@/integrations/supabase/client";
import type {
  AppNotification,
  BuildStatus,
  ChatMessage,
  MessageMeta,
  MessageRole,
  Project,
  ProjectFile,
  ProjectStatus,
  ProjectType,
  ProjectVersion,
  UserSettings,
} from "./types";

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("غير مسجل الدخول");
  return data.user.id;
}

export const projectService = {
  async list(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Project[];
  },

  async get(id: string): Promise<Project | null> {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as unknown as Project) ?? null;
  },

  async create(input: { name: string; description: string; type: ProjectType }): Promise<Project> {
    const user_id = await requireUserId();
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...input, user_id, status: "PLANNING", build_status: "PENDING" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as Project;
  },

  async update(
    id: string,
    patch: Partial<{
      name: string;
      status: ProjectStatus;
      build_status: BuildStatus;
      current_version: string;
      apk_size_mb: number;
      apk_url: string | null;
    }>,
  ): Promise<void> {
    const { error } = await supabase.from("projects").update(patch).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  },
};

export const chatService = {
  async list(projectId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as ChatMessage[];
  },

  async add(
    projectId: string,
    role: MessageRole,
    content: string,
    meta: MessageMeta = {},
  ): Promise<ChatMessage> {
    const user_id = await requireUserId();
    const { data, error } = await supabase
      .from("messages")
      .insert({ project_id: projectId, user_id, role, content, meta })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as ChatMessage;
  },

  async updateMeta(id: string, meta: MessageMeta, content?: string): Promise<void> {
    const patch: Record<string, unknown> = { meta };
    if (content !== undefined) patch['content'] = content;
    const { error } = await supabase.from("messages").update(patch).eq("id", id);
    if (error) throw error;
  },
};

export const fileService = {
  async list(projectId: string): Promise<ProjectFile[]> {
    const { data, error } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("path", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as ProjectFile[];
  },

  async upsertMany(
    projectId: string,
    files: { path: string; content: string; language: string }[],
  ): Promise<void> {
    const user_id = await requireUserId();
    const { error } = await supabase
      .from("project_files")
      .upsert(
        files.map((f) => ({ ...f, project_id: projectId, user_id })),
        { onConflict: "project_id,path" },
      );
    if (error) throw error;
  },

  async save(id: string, content: string): Promise<void> {
    const { error } = await supabase.from("project_files").update({ content }).eq("id", id);
    if (error) throw error;
  },
};

export const versionService = {
  async list(projectId: string): Promise<ProjectVersion[]> {
    const { data, error } = await supabase
      .from("project_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ProjectVersion[];
  },

  async add(input: {
    projectId: string;
    version: string;
    changes: string;
    build_status: BuildStatus;
    apk_size_mb?: number;
  }): Promise<void> {
    const user_id = await requireUserId();
    const { error } = await supabase.from("project_versions").insert({
      project_id: input.projectId,
      user_id,
      version: input.version,
      changes: input.changes,
      build_status: input.build_status,
      apk_size_mb: input.apk_size_mb ?? null,
    });
    if (error) throw error;
  },
};

export const settingsService = {
  async get(): Promise<UserSettings> {
    const user_id = await requireUserId();
    const { data, error } = await supabase
      .from("user_settings")
      .select("user_id, theme, language, notifications_enabled, ai_provider, ai_model, ai_endpoint, ai_api_key")
      .eq("user_id", user_id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      const { data: created, error: insertError } = await supabase
        .from("user_settings")
        .insert({ user_id })
        .select("user_id, theme, language, notifications_enabled, ai_provider, ai_model, ai_endpoint, ai_api_key")
        .single();
      if (insertError) throw insertError;
      return toSettings(created);
    }
    return toSettings(data);
  },

  async update(patch: Partial<Omit<UserSettings, "user_id" | "ai_key_set">>): Promise<void> {
    const user_id = await requireUserId();
    const { error } = await supabase.from("user_settings").update(patch).eq("user_id", user_id);
    if (error) throw error;
  },

  /** The key is write-only from the UI: it is stored, never read back. */
  async setApiKey(key: string): Promise<void> {
    const user_id = await requireUserId();
    const { error } = await supabase
      .from("user_settings")
      .update({ ai_api_key: key.trim() === "" ? null : key.trim() })
      .eq("user_id", user_id);
    if (error) throw error;
  },
};

function toSettings(row: Record<string, unknown>): UserSettings {
  return {
    user_id: String(row['user_id']),
    theme: String(row['theme'] ?? "dark"),
    language: String(row['language'] ?? "ar"),
    notifications_enabled: Boolean(row['notifications_enabled']),
    ai_provider: String(row['ai_provider'] ?? "lovable"),
    ai_model: (row['ai_model'] as string | null) ?? null,
    ai_endpoint: (row['ai_endpoint'] as string | null) ?? null,
    ai_key_set: Boolean(row['ai_api_key']),
  };
}

export const notificationService = {
  async list(): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, project_id, title, body, read, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data ?? []) as unknown as AppNotification[];
  },

  async add(input: { projectId: string | null; title: string; body: string }): Promise<void> {
    const user_id = await requireUserId();
    const { error } = await supabase.from("notifications").insert({
      user_id,
      project_id: input.projectId,
      title: input.title,
      body: input.body,
    });
    if (error) throw error;
  },

  async markAllRead(): Promise<void> {
    const user_id = await requireUserId();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user_id)
      .eq("read", false);
    if (error) throw error;
  },
};

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `منذ ${min} دقيقة`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.round(hours / 24);
  if (days === 1) return "أمس";
  return `منذ ${days} يوم`;
}
