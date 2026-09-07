import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useTranslation } from "react-i18next";
function LoadingBlock() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-16">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function NeedsLogin() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <ShieldAlert className="size-10 text-accent" />
      <h1 className="text-xl font-bold">{t("guards.loginRequired")}</h1>
      <p className="text-sm text-muted-foreground">{t("guards.loginPrompt")}</p>
      <Button asChild>
        <Link to="/login">{t("common.login")}</Link>
      </Button>
    </div>
  );
}

/** Requires an active session (based on GET /auth/me). */
export function Protected({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingBlock />;
  if (!user) return <NeedsLogin />;
  return <>{children}</>;
}

/** Requires an active session with role === "admin". */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, isLoading, isAdmin } = useAuth();
  if (isLoading) return <LoadingBlock />;
  if (!user) return <NeedsLogin />;
  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="text-xl font-bold">{t("guards.unauthorized")}</h1>
        <p className="text-sm text-muted-foreground">{t("guards.adminOnly")}</p>
        <Button asChild variant="secondary">
          <Link to="/books">{t("guards.browseBooks")}</Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}