import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Mail, ShieldCheck, User } from "lucide-react";

import { roleLabel } from "@/api/auth.api";
import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/account/")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.accountIndex;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: () => (
    <Protected>
      <AccountPage />
    </Protected>
  ),
});

function AccountPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!user) return null;

  const rows = [
    { icon: User, label: t("common.name"), value: user.name },
    { icon: Mail, label: t("common.email"), value: user.email },
    { icon: ShieldCheck, label: t("account.accountType"), value: roleLabel(user.role) },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">{t("account.title")}</h1>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 p-4">
            <row.icon className="size-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="font-medium">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Button asChild variant="secondary" className="mt-6 gap-2">
        <Link to="/account/change-password">
          <KeyRound className="size-4" />
          {t("nav.changePassword")}
        </Link>
      </Button>
    </div>
  );
}