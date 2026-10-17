import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { DashboardLink } from "@/lib/dashboard-links";

export function DashboardShell({
  title,
  subtitle,
  links,
  children,
}: {
  title: string;
  subtitle: string;
  links: DashboardLink[];
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/products">
            <Store className="size-4" />
            {t("dashboard.viewMarket")}
          </Link>
        </Button>
      </div>

      {children}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-accent hover:bg-accent/5"
          >
            <Icon className="size-5 text-accent" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
