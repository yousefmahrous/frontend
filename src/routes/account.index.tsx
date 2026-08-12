import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Mail, ShieldCheck, User } from "lucide-react";

import { roleLabel } from "@/api/auth.api";
import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/account/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "حسابي | مكتبة القراء" },
      { name: "description", content: "بيانات حسابك في مكتبة القراء : الاسم، الإيميل ونوع الحساب." },
      { property: "og:title", content: "حسابي | مكتبة القراء" },
      { property: "og:description", content: "بيانات حسابك في مكتبة القراء." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <Protected>
      <AccountPage />
    </Protected>
  ),
});

function AccountPage() {
  const { user } = useAuth();
  if (!user) return null;

  const rows = [
    { icon: User, label: "الاسم", value: user.name },
    { icon: Mail, label: "الإيميل", value: user.email },
    { icon: ShieldCheck, label: "نوع الحساب", value: roleLabel(user.role) },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">حسابي</h1>
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
          تغيير كلمة المرور
        </Link>
      </Button>
    </div>
  );
}