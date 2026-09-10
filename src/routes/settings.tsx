import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Guard } from "@/components/Guard";
import { notificationService, relativeTime, settingsService } from "@/services/data";
import { IS_MOCK_AI, QUALITY_AI_NAME } from "@/services/quality-ai";
import { IS_MOCK_BUILD } from "@/services/build";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — AYMTUB" },
      {
        name: "description",
        content: "إعدادات AYMTUB: الحساب، مفتاح الذكاء الاصطناعي، الإشعارات، والمظهر.",
      },
      { property: "og:title", content: "الإعدادات — AYMTUB" },
      { property: "og:description", content: "تحكّم في حسابك وإعدادات Quality_ai والإشعارات." },
    ],
  }),
  component: () => (
    <Guard>
      <SettingsScreen />
    </Guard>
  ),
});

function SettingsScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, signOut } = useAuth();
  const [keyInput, setKeyInput] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  const settings = useQuery({ queryKey: ["settings"], queryFn: settingsService.get });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: notificationService.list });

  async function saveKey() {
    await settingsService.setApiKey(keyInput);
    setKeyInput("");
    setKeySaved(true);
    await qc.invalidateQueries({ queryKey: ["settings"] });
  }

  async function toggleNotifications() {
    await settingsService.update({ notifications_enabled: !settings.data?.notifications_enabled });
    await qc.invalidateQueries({ queryKey: ["settings"] });
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-5 px-4 pb-8 pt-5">
        <h1 className="text-[17px] font-semibold">الإعدادات</h1>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="text-[13px] font-medium">الحساب</h2>
          <p className="mt-1.5 font-mono text-[11px] text-muted" dir="ltr">
            {user?.email ?? "—"}
          </p>
          <button
            onClick={() => {
              void (async () => {
                await signOut();
                await navigate({ to: "/auth" });
              })();
            }}
            className="mt-3 w-full rounded-[12px] border border-destructive/30 py-2.5 text-[12.5px] text-destructive"
          >
            تسجيل الخروج
          </button>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="text-[13px] font-medium">مفتاح الذكاء الاصطناعي</h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
            يمكنك إضافة مفتاحك الخاص لتشغيل {QUALITY_AI_NAME} بمزوّدك. المفتاح يُخزَّن في حسابك ولا
            يُعاد عرضه أبدًا بعد الحفظ.
          </p>
          <p className="mt-2 font-mono text-[10.5px] text-muted">
            الحالة: {settings.data?.ai_key_set ? "مفتاح محفوظ ✓" : "لا يوجد مفتاح"}
          </p>
          <input
            type="password"
            dir="ltr"
            value={keyInput}
            onChange={(e) => {
              setKeyInput(e.target.value);
              setKeySaved(false);
            }}
            placeholder="sk-..."
            className="mt-2.5 w-full rounded-[12px] border border-line bg-surface-2 px-3 py-2.5 font-mono text-[12px] outline-none placeholder:text-muted focus:border-accent/50"
          />
          <button
            onClick={() => void saveKey()}
            disabled={keyInput.trim() === ""}
            className="mt-2 w-full rounded-[12px] bg-accent py-2.5 text-[12.5px] font-semibold text-background disabled:opacity-50"
          >
            حفظ المفتاح
          </button>
          {keySaved ? <p className="mt-2 text-[11px] text-done">تم حفظ المفتاح ✓</p> : null}
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[13px] font-medium">الإشعارات</h2>
              <p className="mt-1 text-[11.5px] text-muted">تنبيه عند اكتمال بناء المشروع.</p>
            </div>
            <button
              onClick={() => void toggleNotifications()}
              className={`h-6 w-11 rounded-full border transition-colors ${
                settings.data?.notifications_enabled
                  ? "border-accent/50 bg-accent/30"
                  : "border-line bg-surface-2"
              }`}
              aria-label="تبديل الإشعارات"
            >
              <span
                className={`block size-4 rounded-full bg-accent transition-transform ${
                  settings.data?.notifications_enabled ? "translate-x-1" : "translate-x-5"
                }`}
              />
            </button>
          </div>

          <div className="mt-3 space-y-2 border-t border-line pt-3">
            {(notifications.data ?? []).length === 0 ? (
              <p className="text-[11.5px] text-muted">لا توجد إشعارات بعد.</p>
            ) : (
              (notifications.data ?? []).slice(0, 5).map((n) => (
                <div key={n.id} className="rounded-[11px] bg-surface-2 px-3 py-2">
                  <p className="text-[12px] font-medium">{n.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{n.body}</p>
                  <p className="mt-1 font-mono text-[9.5px] text-muted">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="text-[13px] font-medium">عن AYMTUB</h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
            AYMTUB يساعدك على إنشاء تطبيقات وألعاب Android من خلال محادثة مع {QUALITY_AI_NAME}.
          </p>
          <div className="mt-2.5 space-y-1 font-mono text-[10.5px] text-muted">
            <p>وضع الذكاء الاصطناعي: {IS_MOCK_AI ? "تجريبي (Mock)" : "حقيقي"}</p>
            <p>وضع البناء: {IS_MOCK_BUILD ? "تجريبي (Mock Build)" : "سيرفر بناء حقيقي"}</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
