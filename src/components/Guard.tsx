import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

/** UI-level gate. Data access is protected server-side by row-level security. */
export function Guard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <span className="font-mono text-[11px] text-muted">جارٍ التحقق…</span>
      </div>
    );
  }
  return <>{children}</>;
}

export function OfflineBanner() {
  return (
    <div className="border-b border-line bg-amber/10 px-4 py-2 text-center text-[11px] text-amber">
      لا يوجد اتصال بالإنترنت. لن تفقد ما كتبته — سنتابع عند عودة الاتصال.
    </div>
  );
}
