import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { DashboardShell } from "@/components/DashboardShell";
import { AdminOnly } from "@/components/Guards";
import { adminDashboardLinks } from "@/lib/dashboard-links";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  component: () => (
    <AdminOnly>
      <AdminDashboardPage />
    </AdminOnly>
  ),
});

function AdminDashboardPage() {
  const { t } = useTranslation();
  return (
    <DashboardShell
      title={t("dashboard.adminTitle")}
      subtitle={t("dashboard.adminSubtitle")}
      links={adminDashboardLinks(t)}
    >
      <AdminAnalytics />
    </DashboardShell>
  );
}
