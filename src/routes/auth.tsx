import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — AYMTUB" },
      {
        name: "description",
        content: "سجّل الدخول إلى AYMTUB وابدأ إنشاء تطبيقات وألعاب Android مع Quality_ai.",
      },
      { property: "og:title", content: "تسجيل الدخول — AYMTUB" },
      { property: "og:description", content: "حسابك في AYMTUB يحفظ مشاريعك ومحادثاتك وإصداراتك." },
    ],
  }),
  component: AuthScreen,
});

type Mode = "choose" | "signin" | "signup";

function arabicAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("weak") || m.includes("pwned") || m.includes("known to be weak"))
    return "كلمة المرور ضعيفة أو معروفة. اختر كلمة مرور أقوى.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "هذا البريد مسجّل بالفعل. سجّل الدخول بدلًا من ذلك.";
  if (m.includes("password") && m.includes("6")) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
  if (m.includes("email") && m.includes("invalid")) return "البريد الإلكتروني غير صحيح.";
  return "تعذّر إكمال العملية. حاول مرة أخرى.";
}

function AuthScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user) void navigate({ to: "/home" });
  }, [user, navigate]);

  async function withGoogle() {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("تعذّر تسجيل الدخول باستخدام Google. حاول مرة أخرى.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/home" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (signUpError) {
        setError(arabicAuthError(signUpError.message));
        return;
      }
      setNotice("تم إنشاء الحساب. تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول.");
      setMode("signin");
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError("بيانات الدخول غير صحيحة.");
      return;
    }
    void navigate({ to: "/home" });
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden />
      <div className="riso-in relative flex flex-1 flex-col justify-center px-5 py-10">
        <div className="grid size-11 place-items-center rounded-[12px] border border-accent/30 bg-accent/15 font-display text-base font-bold text-accent">
          A
        </div>
        <h1 className="mt-6 text-[22px] font-semibold leading-snug">مرحبًا بك في AYMTUB</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          أنشئ تطبيقات وألعاب Android باستخدام الذكاء الاصطناعي
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-4 rounded-xl border border-done/40 bg-done/10 px-3 py-2 text-[12px] text-done">
            {notice}
          </p>
        ) : null}

        {mode === "choose" ? (
          <div className="mt-7 space-y-2.5">
            <button
              onClick={() => void withGoogle()}
              disabled={busy}
              className="w-full rounded-[14px] bg-accent py-3 text-[13.5px] font-semibold text-background disabled:opacity-60"
            >
              المتابعة باستخدام Google
            </button>
            <button
              onClick={() => setMode("signin")}
              className="w-full rounded-[14px] border border-line bg-surface py-3 text-[13.5px] font-medium"
            >
              المتابعة بالبريد الإلكتروني
            </button>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setMode("signup")}
                className="flex-1 rounded-[14px] border border-line bg-surface-2 py-2.5 text-[12.5px]"
              >
                إنشاء حساب
              </button>
              <button
                onClick={() => setMode("signin")}
                className="flex-1 rounded-[14px] border border-line bg-surface-2 py-2.5 text-[12.5px]"
              >
                تسجيل الدخول
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-2.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[13.5px] outline-none placeholder:text-muted focus:border-accent/50"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[13.5px] outline-none placeholder:text-muted focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-[14px] bg-accent py-3 text-[13.5px] font-semibold text-background disabled:opacity-60"
            >
              {mode === "signup" ? "إنشاء حساب" : "تسجيل الدخول"}
            </button>
            <div className="flex items-center justify-between pt-1 text-[12px] text-muted">
              <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
                {mode === "signup" ? "لدي حساب بالفعل" : "ليس لدي حساب"}
              </button>
              <button type="button" onClick={() => setMode("choose")}>
                طرق دخول أخرى
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 font-mono text-[10px] leading-relaxed text-muted">
          Quality_ai · كل مشاريعك ومحادثاتك محفوظة في حسابك
        </p>
      </div>
    </div>
  );
}
